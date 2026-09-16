from database import Base, engine
from models.student import Student

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")