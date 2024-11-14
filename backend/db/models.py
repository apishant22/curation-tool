from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Researcher(Base):
    __tablename__ = 'Researcher'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=True)
    profile_link = Column(String, nullable=True)
    summary = Column(String, nullable=True)

    papers = relationship('Paper', secondary='Paper_Authors', back_populates='researchers')
    fields_of_study = relationship('Fields_of_Study', secondary='Researcher_Fields_of_Study', back_populates='researchers')

class Paper(Base):
    __tablename__ = 'Paper'
    doi = Column(String, primary_key=True)
    title = Column(String, nullable=True)
    publication_date = Column(Date, nullable=True)
    abstract = Column(String, nullable=True)
    citations = Column(Integer, nullable=True)

    researchers = relationship('Researcher', secondary='Paper_Authors', back_populates='papers')

class Fields_of_Study(Base):
    __tablename__ = 'Fields_of_Study'
    field_id = Column(Integer, primary_key=True, autoincrement=True)
    field_name = Column(String, nullable=False)

    researchers = relationship('Researcher', secondary='Researcher_Fields_of_Study', back_populates='fields_of_study')

class PaperAuthors(Base):
    __tablename__ = 'Paper_Authors'
    doi = Column(String, ForeignKey('Paper.doi'), primary_key=True)
    id = Column(Integer, ForeignKey('Researcher.id'), primary_key=True)

class ResearcherFieldsOfStudy(Base):
    __tablename__ = 'Researcher_Fields_of_Study'
    id = Column(Integer, ForeignKey('Researcher.id'), primary_key=True)
    field_id = Column(Integer, ForeignKey('Fields_of_Study.field_id'), primary_key=True)



