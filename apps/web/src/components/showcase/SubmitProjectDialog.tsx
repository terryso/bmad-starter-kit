import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showcaseApi } from '@/lib/api';
import { Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SubmitProjectDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// GitHub URL 验证正则表达式
const GITHUB_URL_REGEX = /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+\/?$/;

export function SubmitProjectDialog({ trigger, open, onOpenChange }: SubmitProjectDialogProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [error, setError] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: (url: string) => showcaseApi.submitProject(url),
    onSuccess: (data) => {
      toast.success(data.message || '项目提交成功，等待管理员审核');
      setGithubUrl('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsOpen(false);
    },
    onError: (err: unknown) => {
      const response = err as { response?: { data?: { message?: string; statusCode?: number } }; message?: string };
      const message = response?.response?.data?.message || response?.message || '提交失败，请重试';
      const statusCode = response?.response?.data?.statusCode;

      if (statusCode === 409) {
        setError('该项目已经被提交过了');
      } else if (statusCode === 429) {
        setError('提交过于频繁，请稍后再试');
      } else {
        setError(message);
      }
    },
  });

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError('请输入 GitHub 项目链接');
      return false;
    }
    if (!GITHUB_URL_REGEX.test(url)) {
      setError('无效的 GitHub URL 格式，正确格式: https://github.com/owner/repo');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateUrl(githubUrl)) {
      return;
    }

    submitMutation.mutate(githubUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGithubUrl(e.target.value);
    if (error) setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>提交 GitHub 项目</DialogTitle>
            <DialogDescription>
              输入项目的 GitHub URL，系统将自动抓取项目信息并提交审核。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub 项目链接 *</Label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={handleInputChange}
                  className="pl-9"
                  disabled={submitMutation.isPending}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                示例: https://github.com/facebook/react
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={submitMutation.isPending}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交审核'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
