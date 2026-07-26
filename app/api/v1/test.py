from fastapi import APIRouter
from app.api.v1.auth import router
from app.workers.tasks import say_hello

router = APIRouter(
    prefix="/text",
    tags = ["Test"]
)

@router.post("/celery")
async def test_celery():
    say_hello.delay()

    return{
        "message": "Task queued successfully"
    }