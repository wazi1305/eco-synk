import React, { useState, useEffect } from 'react';
import volunteerService from '../../services/volunteerService';

const CreateCampaignWizard = ({ onClose, onCreateCampaign }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'beach',
    location: '',
    address: '',
    date: '',
    time: '',
    volunteerGoal: 50,
    fundingGoal: 5000,
    expectedMaterials: '',
    selectedFriends: [],
    coOrganizers: [],
  });
  const [errors, setErrors] = useState({});
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const response = await volunteerService.getLeaderboard(10);
        if (response.success) {
          setVolunteers(response.leaderboard);
        }
      } catch (error) {
        console.error('Failed to load volunteers:', error);
      }
    };

    loadVolunteers();
  }, []);

  const TOTAL_STEPS = 5;
  const MATERIALS_OPTIONS = [
    'Plastic bags',
    'Bottles',
    'Cans',
    'Glass',
    'Paper',
    'Nets',
    'Gloves',
    'Tools',
    'Seeds',
    'Mulch',
  ];

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.title.length < 3) newErrors.title = 'Title must be at least 3 characters';
    } else if (currentStep === 2) {
      if (!formData.address.trim()) newErrors.address = 'Location is required';
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.time) newErrors.time = 'Time is required';
    } else if (currentStep === 3) {
      if (formData.volunteerGoal < 1) newErrors.volunteerGoal = 'Volunteer goal must be at least 1';
      if (formData.fundingGoal < 100) newErrors.fundingGoal = 'Funding goal must be at least $100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleMaterialToggle = (material) => {
    setFormData((prev) => {
      const materials = prev.expectedMaterials.split(',').filter(m => m.trim());
      if (materials.includes(material)) {
        return {
          ...prev,
          expectedMaterials: materials.filter(m => m !== material).join(', '),
        };
      } else {
        return {
          ...prev,
          expectedMaterials: materials.length === 0 ? material : `${prev.expectedMaterials}, ${material}`,
        };
      }
    });
  };

  const handleCreateCampaign = () => {
    if (validateStep()) {
      const campaign = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        organizer: { name: 'You', avatar: '👤' },
        location: { address: formData.address, lat: 0, lng: 0 },
        date: `${formData.date}T${formData.time}:00Z`,
        status: 'draft',
        image: '🚀',
        volunteers: [],
        volunteerGoal: parseInt(formData.volunteerGoal),
        funding: {
          current: 0,
          goal: parseInt(formData.fundingGoal),
          donations: [],
        },
        materials: formData.expectedMaterials.split(',').map(m => m.trim()),
        esgImpact: {
          co2Saved: 0,
          itemsCollected: 0,
          areaCleaned: 0,
        },
      };

      onCreateCampaign(campaign);
      onClose();
    }
  };

  const selectedMaterials = formData.expectedMaterials
    .split(',')
    .map(m => m.trim())
    .filter(m => m);

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto safe-area-inset">
      <div className="min-h-screen flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto animate-slide-up max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-3xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Create Campaign</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Campaign Title & Description</h3>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Campaign Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Beach Cleanup Drive"
                    className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                      errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                  />
                  {errors.title && <p className="text-xs text-red-600 mt-1">❌ {errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what this cleanup campaign is about..."
                    rows="4"
                    className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium resize-none ${
                      errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">❌ {errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none font-medium"
                  >
                    <option value="beach">🏖️ Beach</option>
                    <option value="park">🌲 Park</option>
                    <option value="river">🌊 River</option>
                    <option value="street">🏙️ Street</option>
                    <option value="forest">🌲 Forest</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Location & Date */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Location & Date</h3>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Location Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g., Coral Bay, California"
                    className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                      errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    }`}
                  />
                  {errors.address && <p className="text-xs text-red-600 mt-1">❌ {errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                        errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                      }`}
                    />
                    {errors.date && <p className="text-xs text-red-600 mt-1">❌ {errors.date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                        errors.time ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                      }`}
                    />
                    {errors.time && <p className="text-xs text-red-600 mt-1">❌ {errors.time}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals & Materials */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Goals & Materials</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Volunteer Goal</label>
                    <input
                      type="number"
                      name="volunteerGoal"
                      value={formData.volunteerGoal}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                      className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                        errors.volunteerGoal ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                      }`}
                    />
                    {errors.volunteerGoal && <p className="text-xs text-red-600 mt-1">❌ {errors.volunteerGoal}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Funding Goal ($)</label>
                    <input
                      type="number"
                      name="fundingGoal"
                      value={formData.fundingGoal}
                      onChange={handleInputChange}
                      min="100"
                      step="100"
                      className={`w-full px-3 py-3 border-2 rounded-lg focus:outline-none font-medium ${
                        errors.fundingGoal ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                      }`}
                    />
                    {errors.fundingGoal && <p className="text-xs text-red-600 mt-1">❌ {errors.fundingGoal}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Expected Materials</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MATERIALS_OPTIONS.map((material) => (
                      <button
                        key={material}
                        type="button"
                        onClick={() => handleMaterialToggle(material)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          selectedMaterials.includes(material)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Team & Invitations */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Invite Your Team</h3>

                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    ✓ Add co-organizers and friends to help spread the word about your campaign!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Co-Organizers</label>
                  <div className="space-y-2">
                    {volunteers.slice(0, 3).map((volunteer) => (
                      <label key={volunteer.user_id} className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="ml-3 font-medium text-gray-900">{volunteer.name}</span>
                        <span className="ml-2 text-xs text-green-600">{volunteer.badge}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Invite Friends</label>
                  <div className="space-y-2">
                    {volunteers.slice(3, 7).map((volunteer) => (
                      <label key={volunteer.user_id} className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="ml-3 font-medium text-gray-900">{volunteer.name}</span>
                        <span className="ml-2 text-xs text-gray-600">{volunteer.past_cleanup_count} cleanups</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Launch */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Review & Launch</h3>

                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Campaign Title</p>
                    <p className="font-bold text-gray-900">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Location</p>
                    <p className="font-bold text-gray-900">{formData.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Volunteer Goal</p>
                      <p className="font-bold text-gray-900">{formData.volunteerGoal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Funding Goal</p>
                      <p className="font-bold text-gray-900">${formData.fundingGoal}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Materials ({selectedMaterials.length})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedMaterials.map((mat) => (
                        <span key={mat} className="bg-green-200 text-green-700 text-xs px-2 py-1 rounded">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                  📋 Save as Draft
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 border-2 border-gray-300 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors min-h-12"
                >
                  ← Back
                </button>
              )}
              {currentStep < TOTAL_STEPS && (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition-all min-h-12"
                >
                  Next →
                </button>
              )}
              {currentStep === TOTAL_STEPS && (
                <button
                  onClick={handleCreateCampaign}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold transition-all min-h-12"
                >
                  🚀 Launch Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignWizard;
