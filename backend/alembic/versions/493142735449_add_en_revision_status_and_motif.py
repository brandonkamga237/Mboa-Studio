"""add_en_revision_status_and_motif

Revision ID: 493142735449
Revises: 4d4358940af0
Create Date: 2026-05-01 12:47:06.602337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '493142735449'
down_revision: Union[str, None] = '4d4358940af0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE statutbrouillon ADD VALUE IF NOT EXISTS 'en_revision'")
    op.add_column('brouillons', sa.Column('motif_revision', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('brouillons', 'motif_revision')
    # PostgreSQL ne permet pas de supprimer une valeur d'enum
