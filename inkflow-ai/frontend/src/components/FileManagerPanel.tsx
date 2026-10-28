'use client';

import React, { useState, useRef } from 'react';
import { UploadedFileItem, uploadFilesOrFolder, deleteUploadedFile, getDownloadFileUrl } from '@/lib/api';
import { Folder, FileText, Upload, FolderPlus, Trash2, Search, RefreshCw, ChevronDown, ChevronRight, Download, CheckCircle2, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface FileManagerPanelProps {
  files: UploadedFileItem[];
  onRefreshFiles: () => void;
  projectId?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const FileManagerPanel: React.FC<FileManagerPanelProps> = ({
  files,
  onRefreshFiles,
  projectId,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed;

  const setCollapsed = (val: boolean) => {
    if (onToggleCollapse) {
      onToggleCollapse(val);
    } else {
      setInternalCollapsed(val);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);

  // Folder collapse / expand state
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const toggleFolderCollapse = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    setShowUploadDropdown(false);
    try {
      const res = await uploadFilesOrFolder(e.target.files, undefined, projectId);
      setUploadMessage(`成功上传 ${res.uploaded_count} 个文件`);
      onRefreshFiles();
      setTimeout(() => setUploadMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || '文件上传失败');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (fileId: number, filename: string) => {
    if (!confirm(`确定要删除文件 ${filename} 吗？`)) return;
    try {
      await deleteUploadedFile(fileId);
      onRefreshFiles();
    } catch (err: any) {
      alert(err.message || '删除文件失败');
    }
  };

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.folder_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group files by folder_path
  const groupedFolders: Record<string, UploadedFileItem[]> = {};
  filteredFiles.forEach((file) => {
    const key = file.folder_path ? file.folder_path : '根目录素材文件';
    if (!groupedFolders[key]) groupedFolders[key] = [];
    groupedFolders[key].push(file);
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // If collapsed: Render 56px compact vertical icon bar
  if (isCollapsed) {
    return (
      <div className="w-[56px] shrink-0 bg-slate-50 border-l border-slate-200/80 flex flex-col items-center py-3 gap-4 h-screen select-none font-sans transition-all duration-300">
        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-blue-600 shadow-xs transition-all"
          title="点击展开文件管理面板"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>

        <div className="w-8 border-t border-slate-200" />

        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs transition-all relative"
          title="文件管理 (点击展开)"
        >
          <Folder className="w-4 h-4 text-blue-500" />
          {files.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
              {files.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setCollapsed(false);
            setTimeout(() => setShowUploadDropdown(true), 150);
          }}
          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-700 font-bold transition-all"
          title="上传文件"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={onRefreshFiles}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
          title="刷新列表"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Expanded View (320px / 360px)
  return (
    <div className="w-[320px] xl:w-[360px] shrink-0 bg-slate-50 border-l border-slate-200/80 flex flex-col h-screen overflow-hidden font-sans select-none transition-all duration-300">
      {/* Hidden File / Folder inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileUpload}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        className="hidden"
      />

      {/* Panel Header */}
      <div className="h-14 px-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(true)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
            title="收起侧边栏"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
          <Folder className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800 tracking-tight">文件管理</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
            {files.length} 个文件
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Upload Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowUploadDropdown(!showUploadDropdown)}
              disabled={isUploading}
              className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all disabled:opacity-50"
              title="上传文件或文件夹"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showUploadDropdown && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1 z-50 text-xs">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>选择文件上传</span>
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>选择文件夹上传</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onRefreshFiles}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
            title="刷新文件列表"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload Notification Tip */}
      {uploadMessage && (
        <div className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs border-b border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-3 bg-white border-b border-slate-200/60 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文件与文件夹..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* File & Folder Expandable / Collapsible Tree View */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {files.length === 0 ? (
          <div className="my-auto text-center p-6 bg-white rounded-2xl border border-slate-200">
            <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-xs text-slate-700">暂无项目文件</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              点击右上角「上传」支持选择本地 Markdown、TXT、PDF 文件或文件夹。
            </p>
          </div>
        ) : (
          Object.entries(groupedFolders).map(([folderName, folderFiles]) => {
            const isFolderCollapsed = Boolean(collapsedFolders[folderName]);

            return (
              <div key={folderName} className="flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {/* Folder Header */}
                <div
                  onClick={() => toggleFolderCollapse(folderName)}
                  className="flex items-center justify-between px-3 py-2 bg-slate-100/70 hover:bg-slate-200/60 cursor-pointer transition-colors border-b border-slate-100"
                >
                  <div className="flex items-center gap-2 truncate">
                    {isFolderCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate">{folderName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                    {folderFiles.length} 个文件
                  </span>
                </div>

                {/* Files List under folder */}
                {!isFolderCollapsed && (
                  <div className="flex flex-col divide-y divide-slate-100 p-1">
                    {folderFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate text-xs text-slate-700 font-medium" title={file.filename}>
                            {file.filename}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{formatSize(file.file_size)}</span>
                          
                          {/* File Download Button */}
                          <a
                            href={getDownloadFileUrl(file.id)}
                            download={file.filename}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors"
                            title="下载文件到本地"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* File Delete Button */}
                          <button
                            onClick={() => handleDelete(file.id, file.filename)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                            title="删除文件"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
