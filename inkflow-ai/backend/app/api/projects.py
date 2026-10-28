from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Project, ArticleDraft
from app.schemas import ProjectCreate, ProjectSchema
from pydantic import BaseModel

router = APIRouter(prefix="/api/projects", tags=["Projects Management"])

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

@router.get("", response_model=List[ProjectSchema])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    # Create default demo project if empty
    if not projects:
        demo = Project(title="智能家居选购指南", category="wechat", description="公众号爆款干货拆解项目")
        db.add(demo)
        db.commit()
        db.refresh(demo)
        projects = [demo]
    return projects

@router.post("", response_model=ProjectSchema)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        title=data.title,
        category=data.category,
        description=data.description
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="未找到指定项目")
    if data.title is not None:
        project.title = data.title
    if data.category is not None:
        project.category = data.category
    if data.description is not None:
        project.description = data.description
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}")
def get_project_detail(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="未找到指定项目")
    drafts = db.query(ArticleDraft).filter(ArticleDraft.project_id == project_id).order_by(ArticleDraft.id.desc()).all()
    return {
        "project": ProjectSchema.model_validate(project),
        "drafts": drafts
    }

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(project)
    db.commit()
    return {"success": True, "message": "项目已成功删除"}
