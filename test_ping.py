from app.workers.celery_app import celery_app
ping_res = celery_app.control.ping(timeout=0.5)
print("PING RESULT:", ping_res)
