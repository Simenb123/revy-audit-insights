
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Star, Clock, User, BookOpen } from 'lucide-react';
import { KnowledgeArticle } from '@/types/knowledge';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface KnowledgeArticleCardProps {
  article: KnowledgeArticle;
  onToggleFavorite?: (articleId: string) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

const KnowledgeArticleCard = ({ 
  article, 
  onToggleFavorite, 
  isFavorite = false, 
  showActions = true 
}: KnowledgeArticleCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content - Horizontal Layout */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              {/* Left Column - Title and Summary */}
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/fag/artikkel/${article.slug}`}
                  className="block group"
                >
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </Link>
                
                {article.summary && (
                  <p className="text-muted-foreground mb-3 line-clamp-2">
                    {article.summary}
                  </p>
                )}

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Forfatter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatDistanceToNow(new Date(article.updated_at), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{article.view_count || 0} visninger</span>
                  </div>
                </div>

                {/* Tags and Categories */}
                <div className="flex flex-wrap gap-2">
                  {article.category && (
                    <Badge variant="secondary" className="text-xs">
                      {article.category.name}
                    </Badge>
                  )}
                  {article.content_type_entity && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: article.content_type_entity.color,
                        color: article.content_type_entity.color 
                      }}
                    >
                      {article.content_type_entity.display_name}
                    </Badge>
                  )}
                  {article.reference_code && (
                    <Badge variant="outline" className="text-xs">
                      {article.reference_code}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right Column - Actions */}
              {showActions && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link to={`/fag/artikkel/${article.slug}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Les
                    </Button>
                  </Link>
                  
                  {onToggleFavorite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleFavorite(article.id)}
                      className={`w-full ${isFavorite ? 'text-yellow-500' : ''}`}
                    >
                      <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Fjern' : 'Favoritt'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeArticleCard;
