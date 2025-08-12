import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, User, Send, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';
import { getReviews, createReview, type Review, type Salon } from '../lib/supabase';

interface ReviewsSectionProps {
  salon: Salon | null;
}

const ReviewsSection = ({ salon }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: ''
  });
  const { modal, hideModal, showSuccess, showError } = useModal();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await getReviews();
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const { error } = await createReview({
        customer_name: formData.customer_name,
        rating: formData.rating,
        comment: formData.comment
      });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          showError('Avaliação Duplicada', 'Você já deixou uma avaliação para este estabelecimento. Cada pessoa pode avaliar apenas uma vez.');
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        setFormData({ customer_name: '', rating: 5, comment: '' });
        showSuccess('Avaliação Publicada!', 'Sua avaliação foi publicada com sucesso! Obrigado pelo seu feedback.');
        // Reload reviews to show the new one immediately
        setTimeout(() => {
          loadReviews();
        }, 1000);
        setTimeout(() => {
          setShowForm(false);
          setSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating review:', error);
      showError('Erro', 'Erro ao enviar avaliação. Verifique sua conexão e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-200`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando avaliações...</p>
      </div>
    );
  }

  const averageRating = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center bg-clinic-50 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg border border-clinic-100 mb-4 md:mb-6">
            <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
            <span className="text-clinic-600 font-semibold">Avaliações dos Clientes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            O que nossos clientes dizem
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Veja as experiências reais de quem já foi atendido em nosso centro terapêutico
          </p>
        </div>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="bg-gradient-to-br from-clinic-50 to-clinic-100 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-8 md:mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <span className="text-4xl md:text-5xl font-bold text-gray-900 mr-2">
                    {averageRating}
                  </span>
                  <div>
                    {renderStars(Math.round(parseFloat(averageRating)))}
                    <p className="text-sm text-gray-600 mt-1">
                      {reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: reviews.length > 0 
                            ? `${(distribution[rating as keyof typeof distribution] / reviews.length) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {distribution[rating as keyof typeof distribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Review Button */}
        <div className="text-center mb-8 md:mb-12">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-clinic-500 to-clinic-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold hover:from-clinic-600 hover:to-clinic-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {showForm ? 'Cancelar' : 'Deixar Avaliação'}
          </button>
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8 md:mb-12 max-w-2xl mx-auto">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Avaliação Publicada!
                </h3>
                <p className="text-gray-600">
                  Obrigado pelo seu feedback! Sua avaliação já está visível para outros clientes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seu nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                    placeholder="Digite seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sua avaliação
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    {renderStars(formData.rating, true, (rating) => 
                      setFormData(prev => ({ ...prev, rating }))
                    )}
                    <span className="text-sm text-gray-600 ml-2">
                      ({formData.rating} estrela{formData.rating !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentário
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-clinic-500 focus:border-transparent"
                    placeholder="Conte-nos sobre sua experiência..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-clinic-500 to-clinic-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-clinic-600 hover:to-clinic-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Avaliação
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {reviews.map(review => (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-clinic-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-clinic-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                    <div className="flex items-center mt-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  "{review.comment}"
                </p>
                
                <p className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Seja o primeiro a avaliar!
            </h3>
            <p className="text-gray-600">
              Compartilhe sua experiência e ajude outros clientes a conhecer nosso trabalho.
            </p>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </section>
  );
};

export default ReviewsSection;