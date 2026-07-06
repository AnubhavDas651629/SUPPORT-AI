from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import current_user

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models import knowledge_base, organization
from app.models.user import User
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    KnowledgeBaseResponse,
    KnowledgeBaseListResponse,
)
from app.services import knowledge_base_service
from app.services.knowledge_base_service import KnowledgeBaseService

router = APIRouter(
    prefix="/organizations/{organization_id}/knowledge-bases",
    tags=["Knowledge Bases"]
)

#create an knowledge base
@router.post("",response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(
    organization_id: UUID, 
    request: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = KnowledgeBaseService(db)

    knowledge_base = await service.create(
        organization_id=organization_id,
        name=request.name,
        description = request.description,
        current_user = current_user
    )

    return KnowledgeBaseResponse.model_validate(knowledge_base)

#list all knowledge bases for an org
@router.get("", response_model=list[KnowledgeBaseListResponse])
async def list_knowledge_bases(
    organization_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = KnowledgeBaseService(db)

    knowledge_bases = await service.list_for_organization(
        organization_id=organization_id,
        current_user=current_user
    )

    return [
        KnowledgeBaseListResponse.model_validate(kb)
        for kb in knowledge_bases
    ]

#List one knowledge base
@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(
    organization_id: UUID,
    knowledge_base_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = KnowledgeBaseService(db)

    knowledge_base = await service.get_by_id(
        organization_id=organization_id,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
    )
    return KnowledgeBaseResponse.model_validate(knowledge_base)

@router.patch("/{knowledge_base_id}",response_model=KnowledgeBaseResponse,)
async def update_knowledge_base(
    organization_id: UUID,
    knowledge_base_id: UUID,
    request: KnowledgeBaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = KnowledgeBaseService(db)

    knowledge_base = await service.update(
        organization_id=organization_id,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
        name=request.name,
        description=request.description,
    )

    return KnowledgeBaseResponse.model_validate(knowledge_base)

@router.delete("/{knowledge_base_id}",status_code=status.HTTP_204_NO_CONTENT,)
async def delete_knowledge_base(
    organization_id: UUID,
    knowledge_base_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = KnowledgeBaseService(db)

    await service.delete(
        organization_id=organization_id,
        knowledge_base_id=knowledge_base_id,
        current_user=current_user,
    )