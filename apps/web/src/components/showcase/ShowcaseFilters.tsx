import type { ProjectCategory } from '@bmad-starter-kit/shared';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShowcaseFiltersProps {
  category?: ProjectCategory;
  language?: string;
  sort: 'latest' | 'stars' | 'recentlyAdded';
  onCategoryChange: (value: string | null) => void;
  onLanguageChange: (value: string | null) => void;
  onSortChange: (value: 'latest' | 'stars' | 'recentlyAdded') => void;
}

const CATEGORIES = [
  { value: 'WEB_APP', label: 'Web 应用' },
  { value: 'CLI', label: '命令行工具' },
  { value: 'LIBRARY', label: '库/框架' },
  { value: 'API', label: 'API 服务' },
  { value: 'MOBILE', label: '移动应用' },
  { value: 'OTHER', label: '其他' },
];

const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
];

const SORT_OPTIONS = [
  { value: 'recentlyAdded', label: '最近提交' },
  { value: 'stars', label: '星标最多' },
  { value: 'latest', label: '最新更新' },
];

export function ShowcaseFilters({
  category,
  language,
  sort,
  onCategoryChange,
  onLanguageChange,
  onSortChange,
}: ShowcaseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* 分类筛选 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="category-filter" className="text-sm whitespace-nowrap">
          分类
        </Label>
        <Select
          value={category || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
        >
          <SelectTrigger id="category-filter" className="w-[140px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 语言筛选 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="language-filter" className="text-sm whitespace-nowrap">
          语言
        </Label>
        <Select
          value={language || 'all'}
          onValueChange={(value) => onLanguageChange(value === 'all' ? null : value)}
        >
          <SelectTrigger id="language-filter" className="w-[140px]">
            <SelectValue placeholder="全部语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部语言</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort-filter" className="text-sm whitespace-nowrap">
          排序
        </Label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger id="sort-filter" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
