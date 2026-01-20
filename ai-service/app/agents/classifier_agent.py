from typing import List, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field
import json

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import ClassifyOut, ClassifiedMessage, MessageType, ConfidenceScore
from app.config.settings import settings
from app.utils.confidence import normalize_confidence

# Define the state for our graph
class ClassifierState(TypedDict):
    messages: List[ChatMessage]
    context: Optional[ContextIn]
    classifications: List[dict]
    explanation: str

# Structured output schema for the LLM
class SingleClassification(BaseModel):
    index: int = Field(description="Index of the message in the input list")
    types: List[MessageType] = Field(description="List of applicable categories")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0.0-1.0")
    reason: str = Field(description="Brief explanation for the classification")

class ClassificationResult(BaseModel):
    results: List[SingleClassification]
    overall_explanation: str

class ClassifierAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.MODEL,
            google_api_key=settings.GEMINI_KEY,
            temperature=0.2
        )
        self.structured_llm = self.llm.with_structured_output(ClassificationResult)
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(ClassifierState)
        
        # Add nodes
        workflow.add_node("classify", self._classify_node)
        
        # Set entry point
        workflow.set_entry_point("classify")
        
        # Add edges
        workflow.add_edge("classify", END)
        
        return workflow.compile()

    async def _classify_node(self, state: ClassifierState) -> ClassifierState:
        messages = state["messages"]
        context = state["context"]
        
        # Format messages for the prompt
        messages_data = [
            {
                "index": i,
                "user": m.user,
                "text": m.message,
                "ts": m.timestamp
            } for i, m in enumerate(messages)
        ]
        
        context_data = {}
        if context:
            context_data = {
                "prior_decisions": context.prior_decisions,
                "prior_actions": context.prior_actions,
                "prior_assumptions": context.prior_assumptions,
                "prior_suggestions": context.prior_suggestions,
                "prior_constraints": context.prior_constraints
            }

        system_prompt = (
            "You are an expert communication analyst. Your task is to classify chat messages into specific categories.\n"
            "Categories:\n"
            "- decision: A final choice or commitment made.\n"
            "- action: A specific task or work item to be performed.\n"
            "- assumption: Something taken for granted or accepted as true without proof.\n"
            "- suggestion: A proposal or idea offered for consideration.\n"
            "- question: A request for information or clarification.\n"
            "- constraint: A limitation or restriction on the project or task.\n"
            "- other: Messages that don't fit the above categories.\n\n"
            "Analyze the messages in the context of previous decisions and actions if provided."
        )

        human_prompt = f"Input Messages: {json.dumps(messages_data, indent=2)}\n\nContext: {json.dumps(context_data, indent=2)}"
        
        response = await self.structured_llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ])
        
        return {
            "classifications": [r.dict() for r in response.results],
            "explanation": response.overall_explanation
        }

    async def run(self, messages: List[ChatMessage], context: Optional[ContextIn] = None) -> ClassifyOut:
        initial_state = {
            "messages": messages,
            "context": context,
            "classifications": [],
            "explanation": ""
        }
        
        final_state = await self.graph.ainvoke(initial_state)
        
        classified_messages = []
        for i, msg in enumerate(messages):
            # Find matching classification
            classification = next(
                (c for c in final_state["classifications"] if c.get("index") == i),
                None
            )
            
            if classification:
                types = classification.get("types", [MessageType.OTHER])
                confidence = classification.get("confidence", 0.7)
                reason = classification.get("reason", "LLM classification")
            else:
                types = [MessageType.OTHER]
                confidence = 0.5
                reason = "No classification returned"
            
            classified_messages.append(
                ClassifiedMessage(
                    user=msg.user,
                    message=msg.message,
                    timestamp=msg.timestamp,
                    type=types,
                    confidence=ConfidenceScore(
                        score=normalize_confidence(confidence),
                        reason=reason
                    )
                )
            )
            
        return ClassifyOut(
            messages=classified_messages,
            explanation=final_state["explanation"]
        )

classifier_agent = ClassifierAgent()
