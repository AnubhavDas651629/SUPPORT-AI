from uuid import UUID

from fastapi import(
    APIRouter,
    Depends,
    File,
    UploadFile,
    status
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import current_user
from starlette.status import HTTP_201_CREATED

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models import document
from app.models.user import User
from app.schemas.document import (
    DocumentResponse,
    DocumentListResponse
)

from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/organizations/{organization_id}/knowledge-bases/{knowledge_base_id}/documents",
    tags=["Documents"],
)

@router.post("", response_model=DocumentResponse, status_code=HTTP_201_CREATED)
async def upload_document(
    organization_id:UUID,
    knowledge_base_id:UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DocumentService(db)

    document = await service.upload(
        organization_id=organization_id,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user
        ,
        file=file
    )
    return DocumentResponse.model_validate(document)