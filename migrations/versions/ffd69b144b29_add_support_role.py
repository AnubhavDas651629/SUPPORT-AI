"""add support role

Revision ID: ffd69b144b29
Revises: c4322ffe4626
Create Date: 2026-07-15 17:02:25.375329

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffd69b144b29'
down_revision: Union[str, Sequence[str], None] = 'c4322ffe4626'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE organizationrole ADD VALUE 'SUPPORT';"
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
