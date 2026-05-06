import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from core.database import Base


class StatutPresence(str, enum.Enum):
    present = "present"
    absent = "absent"
    excuse = "excuse"


class Presence(Base):
    __tablename__ = "presences"
    __table_args__ = (UniqueConstraint("date_samedi", "user_id"),)

    id = Column(Integer, primary_key=True, index=True)
    date_samedi = Column(Date, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    statut = Column(Enum(StatutPresence), nullable=False)
    saisi_par = Column(Integer, ForeignKey("users.id"), nullable=False)
    saisi_le = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="presences")
    saisi_par_user = relationship("User", foreign_keys=[saisi_par])
