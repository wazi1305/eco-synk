const buildVolunteers = (campaign) => {
  if (Array.isArray(campaign.volunteers) && campaign.volunteers.length) {
    return campaign.volunteers;
  }

  if (Array.isArray(campaign.volunteerSummary?.participants) && campaign.volunteerSummary.participants.length) {
    return campaign.volunteerSummary.participants;
  }

  const fallbackCount = campaign.volunteerSummary?.current || campaign.goals?.current_volunteers || 0;
  return Array.from({ length: Math.min(fallbackCount, 12) }, (_, idx) => ({
    name: `Volunteer ${idx + 1}`,
    avatar: '🧑',
    id: `${campaign.id || campaign.campaign_id || 'vol'}_${idx}`
  }));
};

const buildFunding = (campaign) => {
  if (campaign.funding) {
    return {
      current: campaign.funding.current || 0,
      goal: campaign.funding.goal || campaign.funding.target || campaign.goals?.target_funding_usd || 0,
    };
  }

  return {
    current: campaign.goals?.current_funding_usd || 0,
    goal: campaign.goals?.target_funding_usd || 0,
  };
};

const buildEsgImpact = (campaign) => {
  if (campaign.esgImpact) {
    return campaign.esgImpact;
  }

  return {
    itemsCollected: campaign.impact_estimates?.estimated_waste_kg || 0,
    areaCleaned: campaign.impact_estimates?.estimated_area_cleaned_km2 || 0,
    co2Saved: campaign.impact_estimates?.estimated_co2_reduction_kg || 0,
  };
};

const ensureLocation = (campaign) => {
  if (campaign.location && typeof campaign.location === 'object') {
    return campaign.location;
  }

  const lat = campaign.hotspot?.coordinates?.lat ?? campaign.hotspot?.coordinates?.latitude ?? null;
  const lng = campaign.hotspot?.coordinates?.lng ?? campaign.hotspot?.coordinates?.longitude ?? null;
  return {
    lat,
    lng,
    address: campaign.hotspot?.address || 'Unknown location'
  };
};

const inferStatus = (campaign) => {
  if (campaign.status) {
    return campaign.status;
  }
  if (campaign.timeline?.daysRemaining === 0) {
    return 'completed';
  }
  return 'active';
};

const inferDate = (campaign) => {
  return (
    campaign.date ||
    campaign.timeline?.startDate ||
    campaign.timeline?.endDate ||
    campaign.timeline?.scheduledDate ||
    campaign.createdAt ||
    new Date().toISOString()
  );
};

export const normalizeCampaignForUI = (campaign = {}) => {
  const normalized = {
    ...campaign,
    id: campaign.id || campaign.campaign_id || campaign.metadata?.pointId,
    volunteers: buildVolunteers(campaign),
    volunteerGoal:
      campaign.volunteerGoal ||
      campaign.volunteerSummary?.goal ||
      campaign.goals?.volunteer_goal ||
      0,
    funding: buildFunding(campaign),
    esgImpact: buildEsgImpact(campaign),
    location: ensureLocation(campaign),
    organizer: campaign.organizer || { name: 'EcoSynk Operations', avatar: '🌱' },
    date: inferDate(campaign),
    status: inferStatus(campaign),
    image: campaign.image || campaign.ui?.badge || '♻️',
  };

  return normalized;
};

export const normalizeCampaignList = (campaigns = []) => campaigns.map(normalizeCampaignForUI);
