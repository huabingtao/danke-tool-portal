const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface ProjectItem {
  id: number;
  title: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedFileItem {
  id: number;
  project_id?: number;
  filename: string;
  folder_path: string;
  file_size: number;
  doc_id: string;
  created_at: string;
}

export interface GenerateParams {
  topic: string;
  platform: 'wechat' | 'video_script' | 'general';
  style?: string;
  model?: string;
  enable_rag: boolean;
  enable_memory: boolean;
  session_id?: string;
  project_id?: number;
  selected_file_ids?: number[];
}

export interface GenerateResult {
  success: boolean;
  titles: string[];
  outline: string[];
  content: string;
  rag_context_used: string[];
  draft_id?: number;
  model_used?: string;
}

export async function fetchProjects(): Promise<ProjectItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects`);
  if (!res.ok) throw new Error("获取项目列表失败");
  return res.json();
}

export async function createProject(title: string, category: string = "general", description?: string): Promise<ProjectItem> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, description }),
  });
  if (!res.ok) throw new Error("创建项目失败");
  return res.json();
}

export async function updateProject(id: number, title: string): Promise<ProjectItem> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("修改项目名称失败");
  return res.json();
}

export async function deleteProject(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("删除项目失败");
  return res.json();
}

export async function fetchUploadedFiles(projectId?: number): Promise<UploadedFileItem[]> {
  const url = projectId ? `${API_BASE_URL}/api/files?project_id=${projectId}` : `${API_BASE_URL}/api/files`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("获取文件列表失败");
  return res.json();
}

export async function uploadFilesOrFolder(filesList: FileList | File[], folderPaths?: string[], projectId?: number) {
  const formData = new FormData();
  Array.from(filesList).forEach((file, idx) => {
    formData.append("files", file);
    if (folderPaths && folderPaths[idx]) {
      formData.append("folder_paths", folderPaths[idx]);
    } else if ((file as any).webkitRelativePath) {
      const relPath = (file as any).webkitRelativePath;
      const folderDir = relPath.substring(0, relPath.lastIndexOf("/"));
      formData.append("folder_paths", folderDir);
    } else {
      formData.append("folder_paths", "");
    }
  });

  if (projectId) {
    formData.append("project_id", projectId.toString());
  }

  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("上传文件/文件夹失败");
  return res.json();
}

export async function uploadRagDocument(title: string, content: string) {
  const file = new File([content], `${title}.txt`, { type: "text/plain" });
  return uploadFilesOrFolder([file]);
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  category_label: string;
  category_color: string;
  tags: string[];
  triggers?: string[];
  path?: string;
  scripts: string[];
  icon_type?: string;
  prompt_template?: string;
  content_preview?: string;
  source_directory: string;
  full_markdown?: string;
  author?: string;
  downloads?: number;
}

export interface SkillCategory {
  id: string;
  label: string;
  count: number;
  color: string;
}

export interface SkillsResponse {
  total: number;
  page: number;
  size: number;
  total_pages: number;
  source: string;
  categories: SkillCategory[];
  skills: SkillItem[];
}

export interface FetchSkillsParams {
  source?: 'local' | 'market';
  category?: string;
  query?: string;
  page?: number;
  size?: number;
}

export async function fetchSkillsList(params?: FetchSkillsParams): Promise<SkillsResponse> {
  const qParams = new URLSearchParams();
  if (params?.source) qParams.append('source', params.source);
  if (params?.category && params.category !== 'all') qParams.append('category', params.category);
  if (params?.query && params.query.trim()) qParams.append('query', params.query.trim());
  if (params?.page) qParams.append('page', params.page.toString());
  if (params?.size) qParams.append('size', params.size.toString());

  const queryString = qParams.toString() ? `?${qParams.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/api/skills${queryString}`);
  if (!res.ok) throw new Error("获取技能列表失败");
  return res.json();
}

export async function fetchSkillDetail(skillName: string): Promise<SkillItem> {
  const res = await fetch(`${API_BASE_URL}/api/skills/${encodeURIComponent(skillName)}`);
  if (!res.ok) throw new Error("获取技能详情失败");
  return res.json();
}

export async function executeSkill(skillName: string, inputText: string, customScript?: string) {
  const res = await fetch(`${API_BASE_URL}/api/skills/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_name: skillName, input_text: inputText, custom_script: customScript }),
  });
  if (!res.ok) throw new Error("Skill 沙箱执行失败");
  return res.json();
}

export function getDownloadFileUrl(fileId: number): string {
  return `${API_BASE_URL}/api/files/${fileId}/download`;
}

export async function deleteUploadedFile(fileId: number) {
  const res = await fetch(`${API_BASE_URL}/api/files/${fileId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("删除文件失败");
  return res.json();
}

export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "生成失败" }));
    throw new Error(err.detail || "AI 服务响应异常");
  }
  return res.json();
}

export async function sendChatMessage(message: string, model: string, sessionId: string, projectId?: number, selectedFileIds?: number[]) {
  const res = await fetch(`${API_BASE_URL}/api/generate/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      model,
      session_id: sessionId,
      project_id: projectId,
      selected_file_ids: selectedFileIds,
      enable_rag: true
    }),
  });
  if (!res.ok) throw new Error("发送消息失败");
  return res.json();
}

export async function sendChatMessageStream(
  message: string,
  model: string,
  sessionId: string,
  projectId: number | undefined,
  selectedFileIds: number[] | undefined,
  onChunk: (chunk: string) => void
) {
  const res = await fetch(`${API_BASE_URL}/api/generate/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      model,
      session_id: sessionId,
      project_id: projectId,
      selected_file_ids: selectedFileIds,
      enable_rag: true
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: "发送消息失败" }));
    throw new Error(err.detail || "发送消息失败");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}

export async function updateDraft(draftId: number, data: { selected_title?: string; candidate_titles?: string[]; outline?: string[]; markdown_content?: string; formatted_html?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/generate/drafts/${draftId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("更新草稿修改失败");
  return res.json();
}

export async function fetchChatHistory(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/api/memory/history?session_id=${sessionId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUserPreferences() {
  const res = await fetch(`${API_BASE_URL}/api/memory/preferences`);
  if (!res.ok) throw new Error("无法获取个人偏好");
  return res.json();
}

export async function updateUserPreferences(preferences: { writing_style: string; target_platform: string; custom_system_prompt: string }) {
  const res = await fetch(`${API_BASE_URL}/api/memory/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("保存偏好失败");
  return res.json();
}
