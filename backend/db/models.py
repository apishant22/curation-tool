from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Researcher(Base):
    __tablename__ = 'Researcher'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    summary = Column(String, nullable=True)

class Paper(Base):
    __tablename__ = 'Paper'
    doi = Column(String, primary_key=True)
    title = Column(String, nullable=True)
    publication_date = Column(Date, nullable=True)
    abstract = Column(String, nullable=True)
    citations = Column(Integer, nullable=True)

class Paper_Authors(Base):
    __tablename__ = 'Paper_Authors'
    doi = Column(String, ForeignKey('Paper.doi'), primary_key=True)
    id = Column(Integer, ForeignKey('Researcher.id'), primary_key=True)

class Fields_of_study(Base):
    __tablename__ = 'Fields_of_study'
    field_id = Column(Integer, primary_key=True)
    field_name = Column(String, nullable=True)

class Researcher_Fields_of_Study(Base):
    __tablename__ = 'Researcher_Fields_of_Study'
    id = Column(Integer, ForeignKey('Researcher.id'), primary_key=True)
    field_id = Column(Integer, ForeignKey('Fields_of_study.field_id'), primary_key=True)

Researcher.papers = relationship('Paper_Authors', backref='researcher', cascade="all, delete-orphan")
Paper.authors = relationship('Paper_Authors', backref='paper', cascade="all, delete-orphan")

Researcher.fields_of_study = relationship('Researcher_Fields_of_Study', backref='researcher', cascade="all, delete-orphan")
Fields_of_study.researchers = relationship('Researcher_Fields_of_Study', backref='fields_of_study', cascade="all, delete-orphan")
