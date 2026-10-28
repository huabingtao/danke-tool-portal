'use client';

import React, { useState, useEffect } from 'react';
import { LeftSidebar } from '@/components/LeftSidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { SkillsPanel } from '@/components/SkillsPanel';
import { FileManagerPanel } from '@/components/FileManagerPanel';
import { ContentEditModal } from '@/components/ContentEditModal';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectItem,
  fetchUploadedFiles,
  UploadedFileItem,
  generateContent,
  sendChatMessage,
  sendChatMessageStream,
  GenerateResult,
  fetchChatHistory,
} from '@/lib/api';

export default function Home() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<'projects' | 'skills' | 'knowledge'>('projects');

  // Multi-model chat state
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-v4-flash');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Files & Folders state for Right Panel
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [checkedFileIds, setCheckedFileIds] = useState<number[]>([]);

  // Content Edit Modal state
  const [modalData, setModalData] = useState<GenerateResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Right Panel & Chat width adaptation state
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [injectedSkillPrompt, setInjectedSkillPrompt] = useState('');

  // Load Projects on startup
  useEffect(() => {
    fetchProjects()
      .then((projs) => {
        setProjects(projs);
        if (projs.length > 0) {
          setActiveProjectId(projs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load Files and Chat History when active project changes
  useEffect(() => {
    if (activeProjectId) {
      loadProjectFiles(activeProjectId);
      const sessionId = `proj_${activeProjectId}`;
      fetchChatHistory(sessionId)
        .then((hist) => {
          setMessages(
            hist.map((item: any, idx: number) => ({
              id: `hist_${idx}`,
              role: item.role,
              content: item.content,
              model_used: item.model_used,
              created_at: item.created_at,
            }))
          );
        })
        .catch(() => setMessages([]));
    }
  }, [activeProjectId]);

  const loadProjectFiles = (projId: number) => {
    fetchUploadedFiles(projId)
      .then((fList) => {
        setFiles(fList);
        // Default check all files for this project
        setCheckedFileIds(fList.map((f) => f.id));
      })
      .catch(() => setFiles([]));
  };

  const handleCreateProject = async (title: string, category: string) => {
    try {
      const newProj = await createProject(title, category);
      setProjects([newProj, ...projects]);
      setActiveProjectId(newProj.id);
      setActiveNavTab('projects');
    } catch (err: any) {
      alert(err.message || '创建项目失败');
    }
  };

  const handleRenameProject = async (id: number, newTitle: string) => {
    try {
      const updated = await updateProject(id, newTitle);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      alert(err.message || '重命名项目失败');
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      if (activeProjectId === id) {
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      alert(err.message || '删除项目失败');
    }
  };

  const handleToggleCheckFile = (id: number) => {
    setCheckedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCheckAll = (checkAll: boolean) => {
    if (checkAll) {
      setCheckedFileIds(files.map((f) => f.id));
    } else {
      setCheckedFileIds([]);
    }
  };

  const handleSendMessage = async (
    msg: string,
    model: string
  ) => {
    const userMsgId = `user_${Date.now()}`;
    const userMsgObj = { id: userMsgId, role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsgObj]);
    setIsLoading(true);

    const sessionId = activeProjectId ? `proj_${activeProjectId}` : 'default_session';
    const activeProj = projects.find((p) => p.id === activeProjectId);
    const category = activeProj?.category || 'general';

    try {
      if (category !== 'general' && category !== 'chat') {
        // Structured Article / Script Creation Mode for project type
        const result = await generateContent({
          topic: msg,
          platform: category as any,
          model: model,
          enable_rag: files.length > 0,
          enable_memory: true,
          session_id: sessionId,
          project_id: activeProjectId || undefined,
        });

        setModalData(result);

        const categoryNames: Record<string, string> = {
          wechat: '微信公众号长文',
          video_script: '短视频分镜脚本',
          general: '通用内容创作',
        };

        const aiMsgObj = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `为您围绕【${msg}】完成了【${categoryNames[category] || '专业内容'}】构思与创作！已参考后台素材知识库。`,
          model_used: model,
          generatedData: result,
        };
        setMessages((prev) => [...prev, aiMsgObj]);
      } else {
        // Default Pure Chat Mode with SSE Typewriter Stream
        const aiMsgId = `ai_${Date.now()}`;
        let streamedContent = "";
        
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, role: 'assistant', content: '', model_used: model }
        ]);

        await sendChatMessageStream(
          msg,
          model,
          sessionId,
          activeProjectId || undefined,
          undefined,
          (chunk) => {
            streamedContent += chunk;
            setMessages((prev) =>
              prev.map((item) =>
                item.id === aiMsgId ? { ...item, content: streamedContent } : item
              )
            );
          }
        );
      }
    } catch (err: any) {
      const errMsg = err.message || 'AI 响应失败，请重试。';
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, role: 'assistant', content: `⚠️ 请求异常: ${errMsg}`, model_used: model }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* 1. Left Sidebar: Clean Projects & Navigation */}
      <LeftSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        activeNavTab={activeNavTab as any}
        onSelectNavTab={(t) => setActiveNavTab(t as any)}
      />

      {/* 2. Middle Panel: Interactive Chat or Skills Marketplace */}
      {activeNavTab === 'skills' ? (
        <SkillsPanel
          onFillSkillPrompt={(promptText) => {
            setInjectedSkillPrompt(promptText);
            setActiveNavTab('projects');
          }}
        />
      ) : (
        <ChatPanel
          projectTitle={activeProject?.title || 'AI 创作工作台'}
          messages={messages}
          onSendMessage={handleSendMessage}
          onOpenInEditModal={(data) => {
            setModalData(data);
            setIsModalOpen(true);
          }}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSelectModel={(m) => setSelectedModel(m)}
          isExpandedWidth={isRightPanelCollapsed}
          injectedPrompt={injectedSkillPrompt}
        />
      )}

      {/* 3. Right Panel: Dedicated File & Folder Upload Manager */}
      <FileManagerPanel
        files={files}
        onRefreshFiles={() => activeProjectId && loadProjectFiles(activeProjectId)}
        projectId={activeProjectId || undefined}
        isCollapsed={isRightPanelCollapsed}
        onToggleCollapse={(collapsed) => setIsRightPanelCollapsed(collapsed)}
      />

      {/* Content Editing & Rendering Modal */}
      <ContentEditModal
        data={modalData}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={(updated) => setModalData(updated)}
      />
    </div>
  );
}
