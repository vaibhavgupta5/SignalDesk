"""
Contradiction Service - Detects conflicts and inconsistencies in conversation.
"""

from typing import List, Optional, Tuple

from app.schemas.input import ChatMessage, ContextIn
from app.schemas.output import ContradictOut, Contradiction, ConfidenceScore
from app.services.base import LLMClient
from app.utils.confidence import normalize_confidence


class ContradictionService(LLMClient[ContradictOut]):
    """Service for detecting contradictions between new messages and prior context"""
    
    def __init__(self):
        super().__init__(
            prompt_file="contradiction.txt",
            temperature=0.1,  # Very low for precise reasoning
            max_tokens=2048
        )
    
    def build_user_prompt(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> str:
        """Build contradiction detection prompt"""
        
        # Format new messages
        new_messages = "\n".join([
            f"[{msg.user}]: {msg.message}"
            for msg in messages
        ])
        
        # Build prior context - this is critical for contradiction detection
        context_str = "No prior context provided."
        if context:
            context_parts = []
            if context.prior_decisions:
                for d in context.prior_decisions:
                    context_parts.append(f"DECISION: {d}")
            if context.prior_actions:
                for a in context.prior_actions:
                    context_parts.append(f"ACTION: {a}")
            if context.prior_assumptions:
                for a in context.prior_assumptions:
                    context_parts.append(f"ASSUMPTION: {a}")
            if context.prior_constraints:
                for c in context.prior_constraints:
                    context_parts.append(f"CONSTRAINT: {c}")
            if context_parts:
                context_str = "\n".join(context_parts)
        
        return f"""
PRIOR ESTABLISHED CONTEXT:
{context_str}

NEW MESSAGES TO ANALYZE:
{new_messages}

Analyze for contradictions between new messages and prior context.
Look for:
1. Decisions that conflict with prior decisions
2. Actions that violate established constraints
3. Assumptions that contradict known facts
4. Reversals without acknowledgment
5. Invalid assumptions (actions based on unresolved decisions)

Return a JSON object:
{{
  "contradictions": [
    {{
      "new_claim": "exact text from new message",
      "prior_claim": "exact text from prior context",
      "type": "decision_conflict|constraint_violation|assumption_conflict|reversal|invalid_assumption",
      "severity": "critical|high|medium|low",
      "confidence": 0.85,
      "explanation": "Clear explanation of why this is a contradiction"
    }}
  ],
  "is_consistent": true|false,
  "reasoning": "Overall reasoning about consistency"
}}
"""
    
    def parse_response(self, response: dict) -> Tuple[List[dict], bool, str]:
        """Parse LLM response into contradiction results"""
        text = response.get("response", "{}")
        parsed = self.parse_json(text)
        
        if parsed:
            contradictions = parsed.get("contradictions", [])
            is_consistent = parsed.get("is_consistent", True)
            reasoning = parsed.get("reasoning", "")
            return contradictions, is_consistent, reasoning
        
        return [], True, ""
    
    async def detect(
        self,
        messages: List[ChatMessage],
        context: Optional[ContextIn] = None
    ) -> ContradictOut:
        """Detect contradictions in messages given prior context"""
        
        # Build prompt and query LLM
        user_prompt = self.build_user_prompt(messages, context)
        response = await self.query(user_prompt)
        
        # Parse response
        contradiction_data, is_consistent, reasoning = self.parse_response(response)
        
        # Build output
        contradictions = []
        for item in contradiction_data:
            try:
                contradictions.append(
                    Contradiction(
                        claim_a=item.get("new_claim", ""),
                        claim_b=item.get("prior_claim", ""),
                        severity=item.get("severity", "medium"),
                        confidence=ConfidenceScore(
                            score=normalize_confidence(float(item.get("confidence", 0.5))),
                            reason=item.get("type", "LLM detection")
                        ),
                        explanation=item.get("explanation", "Potential contradiction")
                    )
                )
            except Exception:
                continue
        
        # If LLM failed, try fallback
        if not response.get("success", False) and context:
            combined = " ".join([m.message for m in messages])
            fallback_contradictions, fallback_consistent = self._fallback_detect(combined, context)
            if fallback_contradictions:
                contradictions = fallback_contradictions
                is_consistent = fallback_consistent
        
        return ContradictOut(
            contradictions=contradictions,
            is_consistent=is_consistent if not contradictions else False
        )
    
    def _fallback_detect(
        self,
        text: str,
        context: Optional[ContextIn]
    ) -> Tuple[List[Contradiction], bool]:
        """Fallback keyword-based contradiction detection"""
        contradictions = []
        is_consistent = True
        text_lower = text.lower()
        
        negation_words = ["not", "cancel", "revert", "stop", "don't", "won't", "instead", "actually", "no longer"]
        
        if context and context.prior_decisions:
            for decision in context.prior_decisions:
                decision_lower = decision.lower()
                # Check if any key words from decision appear with negation
                if any(neg in text_lower for neg in negation_words):
                    # Simple word overlap check
                    decision_words = set(decision_lower.split())
                    text_words = set(text_lower.split())
                    if decision_words & text_words:  # If there's overlap
                        contradictions.append(
                            Contradiction(
                                claim_a=text,
                                claim_b=f"Prior decision: {decision}",
                                severity="high",
                                confidence=ConfidenceScore(
                                    score=0.55,
                                    reason="Negation with topic overlap detected"
                                ),
                                explanation="Text may contradict prior decision"
                            )
                        )
                        is_consistent = False
        
        return contradictions, is_consistent


# Singleton instance
contradiction_service = ContradictionService()
