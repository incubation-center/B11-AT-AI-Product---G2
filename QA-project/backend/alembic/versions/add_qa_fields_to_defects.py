"""add QA fields to defects: test_steps, expected_result, preconditions

Revision ID: add_qa_fields_001
Revises: aa636a85e171
Create Date: 2026-03-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_qa_fields_001'
down_revision: Union[str, Sequence[str], None] = 'aa636a85e171'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add QA-specific fields to defects table."""
    op.add_column('defects', sa.Column('test_steps', sa.Text(), nullable=True))
    op.add_column('defects', sa.Column('expected_result', sa.Text(), nullable=True))
    op.add_column('defects', sa.Column('preconditions', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema - remove QA-specific fields from defects table."""
    op.drop_column('defects', 'preconditions')
    op.drop_column('defects', 'expected_result')
    op.drop_column('defects', 'test_steps')
