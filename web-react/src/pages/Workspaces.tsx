import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Folder, FileText, Eye, Trash2, Loader, X } from 'lucide-react';

export default function Workspaces() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ content: string; filename: string } | null>(null);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.getWorkspaces(),
  });

  const { data: workspaceFiles } = useQuery({
    queryKey: ['workspace-files', selectedWorkspace],
    queryFn: () => api.getWorkspaceFiles(selectedWorkspace!),
    enabled: !!selectedWorkspace,
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ uuid, filename }: { uuid: string; filename: string }) =>
      api.deleteWorkspaceFile(uuid, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-files', selectedWorkspace] });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (uuid: string) => api.deleteWorkspace(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      if (selectedWorkspace) {
        setSelectedWorkspace(null);
      }
    },
  });

  const previewFileMutation = useMutation({
    mutationFn: ({ uuid, filename }: { uuid: string; filename: string }) =>
      api.previewWorkspaceFile(uuid, filename),
    onSuccess: (content, variables) => {
      setPreviewFile({ content, filename: variables.filename });
    },
  });

  // Select workspace when navigating from Dashboard
  useEffect(() => {
    if (location.state?.selectWorkspace) {
      setSelectedWorkspace(location.state.selectWorkspace);
    }
  }, [location.state]);

  const handleDownload = (uuid: string, filename: string) => {
    const url = api.downloadWorkspaceFile(uuid, filename);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (uuid: string, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      deleteFileMutation.mutate({ uuid, filename });
    }
  };

  const handleDeleteWorkspace = (uuid: string, title: string) => {
    if (confirm(`Are you sure you want to delete the workspace "${title}"? This will delete all files in this workspace and cannot be undone.`)) {
      deleteWorkspaceMutation.mutate(uuid);
    }
  };

  const handlePreview = (uuid: string, filename: string) => {
    previewFileMutation.mutate({ uuid, filename });
  };

  const isPreviewable = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['csv', 'txt', 'md', 'json', 'log'].includes(ext || '');
  };

  const renderPreviewContent = (filename: string, content: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      // Parse CSV and display as table
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',');
      const rows = lines.slice(1, 51); // Show first 50 rows

      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {headers.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  {row.split(',').map((cell, j) => (
                    <td key={j} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length > 51 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing first 50 of {lines.length - 1} rows
            </p>
          )}
        </div>
      );
    }

    // For text files, show as preformatted text
    return <pre className="whitespace-pre-wrap break-words text-sm">{content}</pre>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground">Browse and download files from task workspaces</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Workspaces List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Workspaces</h2>
            {workspaces?.map((workspace) => (
              <Card
                key={workspace.uuid}
                className={`cursor-pointer transition-colors ${
                  selectedWorkspace === workspace.uuid ? 'border-primary' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div
                    className="flex items-center gap-3"
                    onClick={() => setSelectedWorkspace(workspace.uuid)}
                  >
                    <Folder className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{workspace.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{workspace.uuid}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkspace(workspace.uuid, workspace.title);
                      }}
                      disabled={deleteWorkspaceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Files List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {selectedWorkspace ? 'Files' : 'Select a workspace'}
            </h2>
            {!selectedWorkspace ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Select a workspace to view its files
                  </p>
                </CardContent>
              </Card>
            ) : workspaceFiles?.files.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">No files found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {workspaceFiles?.files.map((file) => (
                  <Card key={file}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium truncate">{file}</p>
                          <Badge variant="outline" className="flex-shrink-0">
                            {file.split('.').pop()?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {/* Preview Button */}
                          {isPreviewable(file) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectedWorkspace && handlePreview(selectedWorkspace, file)}
                              disabled={previewFileMutation.isPending}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Download Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectedWorkspace && handleDownload(selectedWorkspace, file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => selectedWorkspace && handleDelete(selectedWorkspace, file)}
                            disabled={deleteFileMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{previewFile.filename}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewFileMutation.isPending ? (
                <div className="flex items-center justify-center h-64">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderPreviewContent(previewFile.filename, previewFile.content)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
