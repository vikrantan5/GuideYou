from fastapi import APIRouter, HTTPException, Depends
from models.submission import Submission, SubmissionCreate, SubmissionUpdate
from utils.auth import get_current_user
from typing import List
from datetime import datetime, timezone
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

router = APIRouter()

@router.post("/", response_model=Submission)
async def create_submission(submission: SubmissionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if task exists
    task = await db.tasks.find_one({"id": submission.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if late
    deadline = datetime.fromisoformat(task['deadline']) if isinstance(task['deadline'], str) else task['deadline']
    is_late = datetime.now(timezone.utc) > deadline
    
    submission_obj = Submission(**submission.model_dump(), student_id=current_user["sub"], is_late=is_late)
    submission_data = submission_obj.model_dump()
    submission_data['submitted_at'] = submission_data['submitted_at'].isoformat()
    
    await db.submissions.insert_one(submission_data)
    
    # Update progress
    today_str = datetime.now(timezone.utc).date().isoformat()
    progress = await db.progress.find_one({"student_id": current_user["sub"]}, {"_id": 0})
    
    if progress:
        streak_dates = progress.get('streak_dates', [])
        if today_str not in streak_dates:
            streak_dates.append(today_str)
            
            # Calculate streak
            sorted_dates = sorted(streak_dates)
            current_streak = 1
            for i in range(len(sorted_dates) - 1, 0, -1):
                prev_date = datetime.fromisoformat(sorted_dates[i-1]).date()
                curr_date = datetime.fromisoformat(sorted_dates[i]).date()
                if (curr_date - prev_date).days == 1:
                    current_streak += 1
                else:
                    break
            
            update_data = {
                "streak_dates": streak_dates,
                "current_streak": current_streak,
                "last_activity": datetime.now(timezone.utc).isoformat()
            }
            
            if current_streak > progress.get('longest_streak', 0):
                update_data['longest_streak'] = current_streak
            
            # Award badges
            badges = progress.get('badges', [])
            if current_streak >= 7 and "7-Day Streak" not in badges:
                badges.append("7-Day Streak")
                update_data['badges'] = badges
            
            await db.progress.update_one(
                {"student_id": current_user["sub"]},
                {"$set": update_data}
            )
    
    return submission_obj

@router.get("/", response_model=List[Submission])
async def get_submissions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        submissions = await db.submissions.find({}, {"_id": 0}).to_list(1000)
    else:
        submissions = await db.submissions.find(
            {"student_id": current_user["sub"]}, 
            {"_id": 0}
        ).to_list(1000)
    
    for sub in submissions:
        if isinstance(sub['submitted_at'], str):
            sub['submitted_at'] = datetime.fromisoformat(sub['submitted_at'])
    
    return [Submission(**sub) for sub in submissions]

@router.get("/task/{task_id}", response_model=List[Submission])
async def get_task_submissions(task_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    submissions = await db.submissions.find({"task_id": task_id}, {"_id": 0}).to_list(1000)
    
    for sub in submissions:
        if isinstance(sub['submitted_at'], str):
            sub['submitted_at'] = datetime.fromisoformat(sub['submitted_at'])
    
    return [Submission(**sub) for sub in submissions]

@router.put("/{submission_id}", response_model=Submission)
async def update_submission(submission_id: str, submission_update: SubmissionUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    submission = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    update_data = submission_update.model_dump(exclude_unset=True)
    await db.submissions.update_one({"id": submission_id}, {"$set": update_data})
    
    # Update progress if approved
    if submission_update.status == "approved" and submission['status'] != "approved":
        await db.progress.update_one(
            {"student_id": submission['student_id']},
            {"$inc": {"completed_tasks": 1}}
        )
        
        # Check for badges
        progress = await db.progress.find_one({"student_id": submission['student_id']}, {"_id": 0})
        if progress:
            badges = progress.get('badges', [])
            completion_rate = (progress['completed_tasks'] / progress['total_tasks'] * 100) if progress['total_tasks'] > 0 else 0
            
            if completion_rate >= 90 and "Best Performer" not in badges:
                badges.append("Best Performer")
                await db.progress.update_one(
                    {"student_id": submission['student_id']},
                    {"$set": {"badges": badges}}
                )
            
            if not submission['is_late'] and "On-Time Hero" not in badges:
                on_time_count = await db.submissions.count_documents({
                    "student_id": submission['student_id'],
                    "status": "approved",
                    "is_late": False
                })
                if on_time_count >= 10:
                    badges.append("On-Time Hero")
                    await db.progress.update_one(
                        {"student_id": submission['student_id']},
                        {"$set": {"badges": badges}}
                    )
    
    updated_submission = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if isinstance(updated_submission['submitted_at'], str):
        updated_submission['submitted_at'] = datetime.fromisoformat(updated_submission['submitted_at'])
    
    return Submission(**updated_submission)

@router.post("/{submission_id}/like")
async def like_submission(submission_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.submissions.update_one(
        {"id": submission_id},
        {"$inc": {"likes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return {"message": "Liked successfully"}