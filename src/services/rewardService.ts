import { CouponReward, CouponValidation, RewardCampaign } from '../types';
import { API_BASE, fetchJson } from './apiClient';
export const rewardService = {
  getRewardCampaign: (slug:string) => fetchJson<RewardCampaign>(`${API_BASE}/cafes/${slug}/rewards/campaign`),
  saveRewardCampaign: (slug:string, body:RewardCampaign) => fetchJson<RewardCampaign>(`${API_BASE}/cafes/${slug}/rewards/campaign`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
  submitRewardFeedback: (slug:string, body:{orderId:string;rating:number;comment:string;email:string}) => fetchJson<CouponReward>(`${API_BASE}/cafes/${slug}/rewards/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
  validateCoupon: (slug:string, code:string, amount:number) => fetchJson<CouponValidation>(`${API_BASE}/cafes/${slug}/rewards/coupons/validate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,amount})}),
  createManualCoupon: (slug:string, body:{email:string;discountPercent:number;validDays:number;minimumOrderAmount:number;label?:string}) => fetchJson<{id:string;email:string;rewardLabel:string;discountPercent:number;expiresAt:string;emailSent:boolean}>(`${API_BASE}/cafes/${slug}/rewards/coupons/manual`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
};
