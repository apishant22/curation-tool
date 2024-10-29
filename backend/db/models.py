from sqlalchemy import Column, String, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Researcher(Base):
    __tablename__ = 'Researcher'
    orcid = Column(String(16), primary_key=True)
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
    orcid = Column(String(16), ForeignKey('Researcher.orcid'), primary_key=True)

class Organisation(Base):
    __tablename__ = 'Organisation'
    org_id = Column(Integer, primary_key=True, autoincrement=True)
    org_name = Column(String, nullable=False)

class Dept(Base):
    __tablename__ = 'Dept'
    dept_id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(Integer, ForeignKey('Organisation.org_id'), nullable=False)
    dept_name = Column(String, nullable=False)

class Researcher_Employment(Base):
    __tablename__ = 'Researcher_Employment'
    orcid = Column(String(16), ForeignKey('Researcher.orcid'), primary_key=True)
    dept_id = Column(Integer, ForeignKey('Dept.dept_id'), primary_key=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    role = Column(String, nullable=True)

class Researcher_Edu(Base):
    __tablename__ = 'Researcher_Edu'
    orcid = Column(String(16), ForeignKey('Researcher.orcid'), primary_key=True)
    dept_id = Column(Integer, ForeignKey('Dept.dept_id'), primary_key=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    role = Column(String, nullable=True)

# Relationships
Researcher.employments = relationship('Researcher_Employment', backref='researcher')
Researcher.education = relationship('Researcher_Edu', backref='researcher')
Organisation.departments = relationship('Dept', backref='organisation')
Dept.employments = relationship('Researcher_Employment', backref='department')
Dept.education = relationship('Researcher_Edu', backref='department')
