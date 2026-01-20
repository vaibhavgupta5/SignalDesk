import asyncio
import os
import json
from app.services.classifier_service import classifier_service
from app.schemas.input import ChatMessage

async def main():
    messages = [
        ChatMessage(user="Aditi", message="We need to finalize how medical reports are processed. I think reports should be encrypted immediately after upload before any analysis happens."),
        ChatMessage(user="Rahul", message="Agreed. Let's make encryption mandatory at the upload layer. No service should ever see a raw medical PDF."),
        ChatMessage(user="Tulika", message="If encryption happens at upload, then downstream agents will need access to the decryption key. Are we assuming all agents run in the same trust boundary?"),
        ChatMessage(user="Rahul", message="Yes, for MVP we are assuming all internal agents run inside a private network and share environment variables securely."),
        ChatMessage(user="Aditi", message="One constraint we need to respect is that encrypted files must never be written outside the shared mounted volume. Otherwise, agents won’t be able to read them."),
        ChatMessage(user="Tulika", message="In that case, I’ll update the upload service to store encrypted files only under /data/files and pass just the file key in the payload."),
        ChatMessage(user="Rahul", message="Good. Also, should we include checksum metadata in the payload so agents can verify file integrity before processing?"),
        ChatMessage(user="Aditi", message="I suggest we add checksum validation later. For now, encryption plus path validation should be enough for MVP."),
        ChatMessage(user="Rahul", message="Alright, decision made: no checksum in MVP. We'll revisit once we move to production hardening."),
        ChatMessage(user="Tulika", message="One more thing — if an agent fails to process a report, should we still persist a failed task entry in the database?"),
        ChatMessage(user="Rahul", message="Yes, every task must end in either SUCCESS or FAILED. No silent drops, even if processing fails early."),
        ChatMessage(user="Aditi", message="That also implies a constraint: database writers must handle null or partial results gracefully."),
        ChatMessage(user="Tulika", message="Understood. I’ll add guards in the database writer so it doesn’t assume successful agent output."),
        ChatMessage(user="Rahul", message="Long term, I’m assuming we’ll move to per-user encryption keys using a KMS, but that’s out of scope for now."),
        ChatMessage(user="Aditi", message="Yes, but let's document that assumption clearly so future contributors understand the security tradeoff.")
    ]
    
    print(f"Querying Classifier Service with {len(messages)} messages...")
    result = await classifier_service.classify(messages)
    
    print("\nResult Sample (First Message):")
    msg = result.messages[0]
    print(f"User: {msg.user}")
    print(f"Message: {msg.message}")
    print(f"Types: {[t.name for t in msg.type]}")
    print(f"Reason: {msg.confidence.reason}")
    print(f"Score: {msg.confidence.score}")
    
    fallbacks = [m for m in result.messages if "Fallback" in m.confidence.reason]
    print(f"\nTotal fallbacks: {len(fallbacks)} / {len(messages)}")

if __name__ == "__main__":
    asyncio.run(main())
