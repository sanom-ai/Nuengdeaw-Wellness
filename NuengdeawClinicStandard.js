'use strict';

/**
 * NuengdeawClinicStandard.js
 * Centralized clinic profile thresholds for rotating subjects.
 */
const NuengdeawClinicStandard = (() => {
  const PROFILE_ID = 'CLINIC_STD_TH_2026Q1';
  const PROFILE_VERSION = '1.0.0';

  // Keep this profile explicit and versioned for auditability.
  const AT_CLINIC_STANDARD = {
    HRV_LOW: 10,
    HRV_STRESS: 20,
    HRV_READY: 50,
    RESP_APNEA: 5,
    RESP_HIGH: 30,
    HR_BRADY: 45,
    HR_TACHY: 120,
    HR_EXTREME: 140,
    GSR_LOW: 0.5,
    GSR_HIGH: 15,
    GSR_EXTREME: 20,
    N400_VETO: 4.0,
    THETA_ALPHA_HIGH: 2.5,
    SESSION_MAX: 7200,
    CONFIDENCE_MIN: 0.5,
    _isAdaptive: false,
    _baselineDate: null,
    _profileId: PROFILE_ID,
    _profileVersion: PROFILE_VERSION,
  };

  const getAT = () => ({ ...AT_CLINIC_STANDARD });

  const getProfileMeta = () => ({
    profileId: PROFILE_ID,
    profileVersion: PROFILE_VERSION,
    profileLabel: 'Clinic Standard',
  });

  return { getAT, getProfileMeta, version: PROFILE_VERSION };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NuengdeawClinicStandard;
else if (typeof window !== 'undefined') window.NuengdeawClinicStandard = NuengdeawClinicStandard;
