from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class SubmissionBase(BaseModel):
    task_id: str
    content: str  # Could be text, base64 image, or URL
    file_url: Optional[str] = None  # Optional file URL

class SubmissionCreate(SubmissionBase):
    pass

class Submission(SubmissionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    status: str = "pending"  # "pending", "approved", "rejected"
    feedback: Optional[str] = None
    ai_feedback: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_late: bool = False
    likes: int = 0
    file_url: Optional[str] = None

class SubmissionUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None