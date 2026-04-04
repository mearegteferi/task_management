"""add architect task fields

Revision ID: 5b5ad7c9c4f1
Revises: f47cdcd62393
Create Date: 2026-04-06 12:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5b5ad7c9c4f1'
down_revision: str | Sequence[str] | None = 'f47cdcd62393'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


task_status_enum = sa.Enum('TODO', 'IN_PROGRESS', 'DONE', name='taskstatus')


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    task_status_enum.create(bind, checkfirst=True)

    op.add_column('tasks', sa.Column('description', sa.String(), nullable=True))
    op.add_column(
        'tasks',
        sa.Column(
            'status',
            task_status_enum,
            nullable=False,
            server_default=sa.text("'TODO'::taskstatus"),
        ),
    )
    op.add_column(
        'tasks',
        sa.Column('priority', sa.Integer(), nullable=False, server_default=sa.text('1')),
    )

    op.execute("UPDATE tasks SET status = 'DONE' WHERE is_completed = true")

    op.alter_column('tasks', 'status', server_default=None)
    op.alter_column('tasks', 'priority', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tasks', 'priority')
    op.drop_column('tasks', 'status')
    op.drop_column('tasks', 'description')

    bind = op.get_bind()
    task_status_enum.drop(bind, checkfirst=True)
