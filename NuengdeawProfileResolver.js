'use strict';

/**
 * NuengdeawProfileResolver.js
 * Resolves assessment profile mode into adaptiveAT + audit metadata.
 */
const NuengdeawProfileResolver = (() => {
  const PROFILE_MODES = ['personal', 'clinic'];

  const normalizeMode = (mode) => {
    const value = String(mode || '').toLowerCase();
    return PROFILE_MODES.includes(value) ? value : 'personal';
  };

  const resolve = (options = {}) => {
    const profileMode = normalizeMode(options.profileMode);
    const subjectId = options.subjectId ? String(options.subjectId).trim() : '';

    if (profileMode === 'clinic') {
      const clinicAT = NuengdeawClinicStandard.getAT();
      const clinicMeta = NuengdeawClinicStandard.getProfileMeta();
      return {
        profileMode: 'clinic',
        subjectId: subjectId || 'ANON',
        adaptiveAT: clinicAT,
        baselineSource: 'clinic_standard',
        calibrationRequired: false,
        profileId: clinicMeta.profileId,
        profileVersion: clinicMeta.profileVersion,
      };
    }

    const hasBaseline = NuengdeawBaseline.isCalibrated();
    return {
      profileMode: 'personal',
      subjectId: subjectId || 'SELF',
      adaptiveAT: hasBaseline ? NuengdeawBaseline.getAdaptiveAT() : null,
      baselineSource: hasBaseline ? 'personal_baseline' : 'static_fallback',
      calibrationRequired: !hasBaseline,
      profileId: 'PERSONAL_BASELINE',
      profileVersion: NuengdeawBaseline.version || '1.0.0',
    };
  };

  return { PROFILE_MODES, normalizeMode, resolve, version: '1.0.0' };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NuengdeawProfileResolver;
else if (typeof window !== 'undefined') window.NuengdeawProfileResolver = NuengdeawProfileResolver;
