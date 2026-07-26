from app.workers.celery_app import celery_app

@celery_app.task
def say_hello():
    print("Hello from celery workey")