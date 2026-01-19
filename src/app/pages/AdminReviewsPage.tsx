import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminSidebar } from '../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { useBranding } from '../contexts/BrandingContext';
import api from '../../api/client';
import { Loader2, Star, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isFeatured: boolean;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export const AdminReviewsPage: React.FC = () => {
  const { t } = useTranslation();
  const { tenantId } = useBranding();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const loadReviews = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const res = await api.get(`/reviews?tenantId=${tenantId}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Error loading reviews', error);
      toast.error(t('admin.reviews_page.update_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [tenantId]);

  const startEditing = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleSave = async (review: Review) => {
    if (!tenantId) return;
    try {
      setLoading(true);
      await api.patch(`/reviews/${review.id}?tenantId=${tenantId}`, {
        rating: editRating,
        comment: editComment,
        isFeatured: review.isFeatured,
      });
      toast.success(t('admin.reviews_page.update_success'));
      setEditingId(null);
      await loadReviews();
    } catch (error) {
      console.error('Error updating review', error);
      toast.error(t('admin.reviews_page.update_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!tenantId) return;
    if (!window.confirm(t('admin.reviews_page.delete_confirm'))) return;
    try {
      setLoading(true);
      await api.delete(`/reviews/${review.id}?tenantId=${tenantId}`);
      toast.success(t('admin.reviews_page.delete_success'));
      await loadReviews();
    } catch (error) {
      console.error('Error deleting review', error);
      toast.error(t('admin.reviews_page.delete_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (review: Review) => {
    if (!tenantId) return;
    try {
      setLoading(true);
      await api.patch(`/reviews/${review.id}?tenantId=${tenantId}`, {
        isFeatured: !review.isFeatured,
      });
      await loadReviews();
    } catch (error) {
      console.error('Error toggling featured', error);
      toast.error(t('admin.reviews_page.update_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-950">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('admin.reviews_page.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('admin.reviews_page.subtitle')}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reviews_page.list_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              {!loading && reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.reviews_page.no_reviews')}
                </p>
              )}
              {!loading && reviews.length > 0 && (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const isEditing = editingId === review.id;
                    return (
                      <div
                        key={review.id}
                        className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {t('admin.reviews_page.client_label')}:
                            </span>
                            <span>{review.user?.name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {t('admin.reviews_page.rating_label')}:
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                value={editRating}
                                onChange={(e) =>
                                  setEditRating(Number(e.target.value))
                                }
                                className="w-20"
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium">
                              {t('admin.reviews_page.comment_label')}:
                            </span>
                            {isEditing ? (
                              <Input
                                value={editComment}
                                onChange={(e) =>
                                  setEditComment(e.target.value)
                                }
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {review.comment || '—'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={review.isFeatured}
                              onCheckedChange={() => toggleFeatured(review)}
                              id={`featured-${review.id}`}
                            />
                            <label
                              htmlFor={`featured-${review.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {t('admin.reviews_page.featured_label')}
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSave(review)}
                                disabled={loading}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                {t('admin.reviews_page.save')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={loading}
                              >
                                <X className="w-4 h-4 mr-1" />
                                {t('admin.reviews_page.cancel')}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(review)}
                                disabled={loading}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                {t('admin.reviews_page.edit')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(review)}
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {t('admin.reviews_page.delete')}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
