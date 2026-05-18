from app.core.database import Base
from app.models.user import User, RoleEnum
from app.models.report import Report
from app.models.package import Package
from app.models.appointment import Appointment
from app.models.test_history import TestHistory

# This file imports all the models so that Alembic can import them from here
# for 'autogenerate' support.
