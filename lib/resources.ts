export interface CampusResource {
  name: string;
  counseling_url: string;
  counseling_phone: string;
}

export const CAMPUS_RESOURCES: Record<string, CampusResource> = {
  "arizona.edu": {
    name: "University of Arizona Counseling & Psych Services",
    counseling_url: "https://health.arizona.edu/counseling-psych-services",
    counseling_phone: "+1-520-621-3334",
  },
  "asu.edu": {
    name: "ASU Counseling Services",
    counseling_url: "https://eoss.asu.edu/counseling",
    counseling_phone: "+1-480-965-6146",
  },
  "ucla.edu": {
    name: "UCLA CAPS",
    counseling_url: "https://counseling.ucla.edu",
    counseling_phone: "+1-310-825-0768",
  },
  "berkeley.edu": {
    name: "UC Berkeley Counseling & Psychological Services",
    counseling_url: "https://uhs.berkeley.edu/caps",
    counseling_phone: "+1-510-642-9494",
  },
  "ucsd.edu": {
    name: "UC San Diego Counseling & Psychological Services",
    counseling_url: "https://caps.ucsd.edu",
    counseling_phone: "+1-858-534-3755",
  },
  "usc.edu": {
    name: "USC Student Health Counseling and Mental Health",
    counseling_url: "https://studenthealth.usc.edu/counseling",
    counseling_phone: "+1-213-740-9355",
  },
  "stanford.edu": {
    name: "Stanford Counseling and Psychological Services",
    counseling_url: "https://vaden.stanford.edu/caps",
    counseling_phone: "+1-650-723-3785",
  },
  "mit.edu": {
    name: "MIT Mental Health & Counseling",
    counseling_url: "https://studentlife.mit.edu/mentalhealth",
    counseling_phone: "+1-617-253-2916",
  },
  "harvard.edu": {
    name: "Harvard CAMHS",
    counseling_url: "https://camhs.huhs.harvard.edu",
    counseling_phone: "+1-617-495-2042",
  },
  "yale.edu": {
    name: "Yale Mental Health & Counseling",
    counseling_url: "https://yalehealth.yale.edu/mental-health",
    counseling_phone: "+1-203-432-0290",
  },
  "princeton.edu": {
    name: "Princeton Counseling and Psychological Services",
    counseling_url: "https://uhs.princeton.edu/counseling-psychological-services",
    counseling_phone: "+1-609-258-3141",
  },
  "columbia.edu": {
    name: "Columbia Counseling and Psychological Services",
    counseling_url: "https://www.health.columbia.edu/content/counseling-and-psychological-services",
    counseling_phone: "+1-212-854-2878",
  },
  "upenn.edu": {
    name: "Penn Counseling and Psychological Services",
    counseling_url: "https://wellness.upenn.edu/caps",
    counseling_phone: "+1-215-898-7021",
  },
  "cornell.edu": {
    name: "Cornell Counseling & Psychological Services",
    counseling_url: "https://health.cornell.edu/services/mental-health-care",
    counseling_phone: "+1-607-255-5155",
  },
  "nyu.edu": {
    name: "NYU Counseling and Wellness Services",
    counseling_url: "https://www.nyu.edu/students/health-and-wellness/counseling-services.html",
    counseling_phone: "+1-212-443-9999",
  },
  "cmu.edu": {
    name: "Carnegie Mellon Counseling and Psychological Services",
    counseling_url: "https://www.cmu.edu/counseling",
    counseling_phone: "+1-412-268-2922",
  },
  "umich.edu": {
    name: "University of Michigan CAPS",
    counseling_url: "https://caps.umich.edu",
    counseling_phone: "+1-734-764-8312",
  },
  "wisc.edu": {
    name: "UW-Madison Mental Health Services",
    counseling_url: "https://www.uhs.wisc.edu/mental-health",
    counseling_phone: "+1-608-265-5600",
  },
  "uiuc.edu": {
    name: "UIUC Counseling Center",
    counseling_url: "https://counselingcenter.illinois.edu",
    counseling_phone: "+1-217-333-3704",
  },
  "gatech.edu": {
    name: "Georgia Tech Counseling Center",
    counseling_url: "https://counseling.gatech.edu",
    counseling_phone: "+1-404-894-2575",
  },
  "utexas.edu": {
    name: "UT Austin Counseling and Mental Health Center",
    counseling_url: "https://cmhc.utexas.edu",
    counseling_phone: "+1-512-471-3515",
  },
  "tamu.edu": {
    name: "Texas A&M Counseling & Psychological Services",
    counseling_url: "https://caps.tamu.edu",
    counseling_phone: "+1-979-845-4427",
  },
  "ufl.edu": {
    name: "UF Counseling and Wellness Center",
    counseling_url: "https://counseling.ufl.edu",
    counseling_phone: "+1-352-392-1575",
  },
  "unc.edu": {
    name: "UNC CAPS",
    counseling_url: "https://caps.unc.edu",
    counseling_phone: "+1-919-966-3658",
  },
  "virginia.edu": {
    name: "UVA CAPS",
    counseling_url: "https://www.studenthealth.virginia.edu/caps",
    counseling_phone: "+1-434-243-5150",
  },
  "umd.edu": {
    name: "University of Maryland Counseling Center",
    counseling_url: "https://counseling.umd.edu",
    counseling_phone: "+1-301-314-7651",
  },
  "psu.edu": {
    name: "Penn State Counseling and Psychological Services",
    counseling_url: "https://studentaffairs.psu.edu/counseling",
    counseling_phone: "+1-814-863-0395",
  },
  "osu.edu": {
    name: "Ohio State Counseling and Consultation Service",
    counseling_url: "https://ccs.osu.edu",
    counseling_phone: "+1-614-292-5766",
  },
};

export const NATIONAL_CRISIS_RESOURCES = {
  lifeline_988: {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    url: "https://988lifeline.org",
  },
  crisis_text_line: {
    name: "Crisis Text Line",
    sms: "741741",
    keyword: "HOME",
    url: "https://www.crisistextline.org",
  },
  trevor_project: {
    name: "Trevor Project",
    phone: "+1-866-488-7386",
    url: "https://www.thetrevorproject.org",
  },
} as const;

export function getCampusResourceByDomain(
  domain: string,
): CampusResource | null {
  return CAMPUS_RESOURCES[domain.toLowerCase().trim()] ?? null;
}
