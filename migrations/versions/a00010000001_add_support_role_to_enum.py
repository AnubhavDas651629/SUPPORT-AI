"""add support role to organizationrole enum

Revision ID: a00010000001
Revises: 69901bf707ca
Create Date: 2026-07-15 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a00010000001'
down_revision: Union[str, Sequence[str], None] = 'ffd69b144b29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'SUPPORT' value to postgres enum type 'organizationrole' if not already present
    op.execute("ALTER TYPE organizationrole ADD VALUE IF NOT EXISTS 'SUPPORT'")
    # Add 'SUPPORT' value to postgres enum type 'messagerole' if not already present
    op.execute("ALTER TYPE messagerole ADD VALUE IF NOT EXISTS 'SUPPORT'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from ENUM types easily without recreating the type
    pass
