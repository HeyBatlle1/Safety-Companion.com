export interface ChecklistData {
  [key: string]: {
    title: string;
    description: string;
    aiContext: string;
    sections: {
      title: string;
      description?: string;
      items: {
        id: string;
        question: string;
        options: string[];
        inputType?: 'text' | 'textarea' | 'number' | 'select' | 'email' | 'tel' | 'date';
        placeholder?: string;
        required?: boolean;
        notes?: boolean;
        critical?: boolean;
        images?: boolean;
        files?: boolean; // Support for blueprints, documents, etc.
        deadline?: boolean;
        aiWeight?: number; // Importance for AI analysis (1-10)
        riskCategory?: string; // Category for AI risk assessment
        complianceStandard?: string; // Relevant safety standard
      }[];
    }[];
  };
}

// MASTER JHA - Consolidated from six checklists to eliminate redundancy
// Preserves all OSHA compliance while streamlining user experience
export const checklistData: ChecklistData = {
  'master-jha': {
    title: 'Master Job Hazard Analysis (JHA)',
    description: 'Comprehensive safety analysis consolidating all OSHA requirements into one intelligent assessment',
    aiContext: 'This master JHA combines all six specialized checklists into one comprehensive assessment. It covers glass installation, fall protection, electrical safety, confined space entry, fire prevention, and emergency action planning. The AI should analyze weather conditions automatically through function calls and provide contextual safety recommendations based on actual site conditions.',
    sections: [
      {
        title: 'Site Location & Project Details',
        description: 'Essential information for weather integration and risk assessment',
        items: [
          {
            id: 'site_location',
            question: 'Job Site Address/Location',
            options: [],
            inputType: 'text',
            placeholder: 'Enter complete job site address (e.g., 123 Main St, Indianapolis, IN)',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'location_hazards',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'project_type',
            question: 'Type of Work Being Performed',
            options: [
              'Glass Installation/Curtain Wall',
              'Electrical Work',
              'Excavation/Trenching', 
              'Confined Space Entry',
              'Hot Work/Welding',
              'General Construction',
              'Multiple Work Types'
            ],
            inputType: 'select',
            required: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'work_complexity',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'work_height',
            question: 'Maximum Work Height (feet)',
            options: [],
            inputType: 'number',
            placeholder: 'Enter height in feet',
            required: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.501'
          },
          {
            id: 'crew_size',
            question: 'Number of Workers on Site',
            options: [],
            inputType: 'number',
            placeholder: 'Enter number of workers',
            required: true,
            aiWeight: 7,
            riskCategory: 'personnel_management',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Environmental & Safety Hazards Assessment',
        description: 'Comprehensive hazard identification and weather-dependent safety analysis',
        items: [
          {
            id: 'fall_protection_required',
            question: 'Fall Protection Systems Present',
            options: [],
            inputType: 'textarea',
            placeholder: 'Describe scaffolding, guardrails, harnesses, safety nets, anchor points...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'electrical_hazards',
            question: 'Electrical Hazards Assessment',
            options: [],
            inputType: 'textarea',
            placeholder: 'Describe power sources, GFCI protection, wet conditions, overhead lines, tool conditions...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.416'
          },
          {
            id: 'additional_hazards',
            question: 'Additional Site-Specific Hazards',
            options: [],
            inputType: 'textarea',
            placeholder: 'Describe any other hazards: confined spaces, excavation, fire/hot work, chemicals, traffic...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 8,
            riskCategory: 'general_hazards',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Personnel & Emergency Preparedness',
        description: 'Worker qualifications and emergency response capabilities',
        items: [
          {
            id: 'worker_training',
            question: 'Worker Training & PPE Status',
            options: [],
            inputType: 'textarea',
            placeholder: 'List safety training, certifications, PPE available (hard hats, safety glasses, etc.)...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'emergency_procedures',
            question: 'Emergency Response Preparedness',
            options: [],
            inputType: 'textarea',
            placeholder: 'Describe first aid availability, evacuation routes, emergency contacts, medical response...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'medical_emergency',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      }
    ]
  },
  // BACKUP CHECKLISTS - Preserved for fallback
  'safety-assessment': {
    title: 'Glass Installation Site Safety Assessment',
    description: 'Comprehensive safety evaluation for high-rise glass installation and curtain wall systems',
    aiContext: 'This assessment focuses on glass installation at height, including curtain wall systems, window walls, and structural glazing. Key risks include fall hazards, glass handling, weather conditions, and public safety.',
    sections: [
      {
        title: 'Project Information & Location',
        description: 'Essential project details for risk assessment',
        items: [
          {
            id: 'sa-1',
            question: 'Project Location and Building Height',
            options: ['Enter full address and building height'],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'location_hazards',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-2',
            question: 'Glass Installation Type',
            options: [
              'Structural Glazing (High Risk)',
              'Curtain Wall System (High Risk)',
              'Window Wall Installation (Medium Risk)',
              'Point-Supported Glass (High Risk)',
              'Storefront System (Low Risk)',
              'Glass Replacement/Retrofit (Medium Risk)',
              'Skylight Installation (High Risk)'
            ],
            critical: true,
            aiWeight: 9,
            riskCategory: 'work_complexity',
            complianceStandard: 'ANSI/IWCA I-14.1'
          },
          {
            id: 'sa-3',
            question: 'Building Access and Crane Requirements',
            options: [
              'Tower crane required',
              'Mobile crane access available',
              'Suspended scaffold system',
              'Boom lift/MEWP access',
              'Internal access only',
              'Multiple access methods needed'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'access_hazards',
            complianceStandard: 'OSHA 1926.550'
          },
          {
            id: 'sa-4',
            question: 'Public Exposure Level',
            options: [
              'High pedestrian traffic area',
              'Moderate foot traffic',
              'Low public exposure',
              'Restricted access area',
              'Active roadway adjacent',
              'Public transportation nearby'
            ],
            critical: true,
            aiWeight: 9,
            riskCategory: 'public_safety',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Environmental & Weather Conditions',
        description: 'Critical weather factors affecting glass installation safety',
        items: [
          {
            id: 'sa-5',
            question: 'Current Wind Conditions',
            options: [
              '0-10 mph (Safe for all glass operations)',
              '11-15 mph (Caution for large panels)',
              '16-20 mph (Limited operations only)',
              '21-25 mph (Suspend large glass installation)',
              'Above 25 mph (All glass work suspended)',
              'Gusty/variable winds (High risk)'
            ],
            critical: true,
            aiWeight: 10,
            riskCategory: 'weather_hazards',
            complianceStandard: 'ANSI/IWCA I-14.1'
          },
          {
            id: 'sa-6',
            question: 'Temperature and Thermal Conditions',
            options: [
              'Below 20°F (Special cold weather protocols)',
              '20-40°F (Standard cold weather procedures)',
              '41-85°F (Optimal installation conditions)',
              '86-95°F (Heat stress monitoring required)',
              'Above 95°F (Enhanced heat safety measures)',
              'Rapid temperature changes expected'
            ],
            critical: true,
            aiWeight: 7,
            riskCategory: 'weather_hazards',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-7',
            question: 'Precipitation and Visibility',
            options: [
              'Clear conditions',
              'Light rain/drizzle (operations suspended)',
              'Heavy rain (all work stopped)',
              'Snow/ice conditions (extreme caution)',
              'Fog/reduced visibility (operations suspended)',
              'Forecast shows deteriorating conditions'
            ],
            critical: true,
            aiWeight: 9,
            riskCategory: 'weather_hazards',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Glass Handling Equipment & Systems',
        description: 'Specialized equipment for safe glass installation',
        items: [
          {
            id: 'sa-8',
            question: 'Glass Lifting and Positioning Equipment',
            options: [
              'Vacuum lifters (certified and tested)',
              'Glass dollies and transport racks',
              'Suction cup systems',
              'Mechanical glass handlers',
              'Crane-mounted glass lifters',
              'Manual handling only (high risk)'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'equipment_safety',
            complianceStandard: 'ANSI Z87.1'
          },
          {
            id: 'sa-9',
            question: 'Fall Protection Systems for Glass Work',
            options: [
              'Suspended scaffold with guardrails',
              'Personal fall arrest systems',
              'Safety nets below work area',
              'Boom lift with fall protection',
              'Roof anchor points certified',
              'Inadequate fall protection (critical issue)'
            ],
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'sa-10',
            question: 'Equipment Certification Status',
            options: [
              'All equipment current certifications',
              'Some equipment pending inspection',
              'Equipment overdue for certification',
              'New equipment requiring initial inspection',
              'Equipment with known deficiencies',
              'Certification status unknown'
            ],
            critical: true,
            notes: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'equipment_safety',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Glass Storage and Material Handling',
        description: 'Safe storage and transport of glass materials',
        items: [
          {
            id: 'sa-11',
            question: 'Glass Storage Area Conditions',
            options: [
              'Properly leveled and stable surface',
              'Weather protection adequate',
              'Secure from unauthorized access',
              'Storage area requires improvement',
              'Temporary storage only',
              'Storage conditions inadequate'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'material_handling',
            complianceStandard: 'OSHA 1926.250'
          },
          {
            id: 'sa-12',
            question: 'Glass Transport Path Safety',
            options: [
              'Clear and unobstructed path',
              'Minor obstacles easily removed',
              'Path requires significant clearing',
              'Alternative route needed',
              'Multiple hazards in transport path',
              'Transport path unsafe'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'material_handling',
            complianceStandard: 'OSHA 1926.250'
          },
          {
            id: 'sa-13',
            question: 'Glass Panel Size and Weight Considerations',
            options: [
              'Standard size panels (manageable risk)',
              'Oversized panels requiring special handling',
              'Heavy panels requiring mechanical assistance',
              'Irregular shaped glass (increased difficulty)',
              'Multiple panel types (complex logistics)',
              'Panels exceed equipment capacity'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'material_handling',
            complianceStandard: 'OSHA 1926.250'
          }
        ]
      },
      {
        title: 'Personnel Safety and Training',
        description: 'Worker qualifications and safety measures',
        items: [
          {
            id: 'sa-14',
            question: 'Glass Installation Team Qualifications',
            options: [
              'All personnel certified for glass work',
              'Team has extensive high-rise experience',
              'Some team members need additional training',
              'New team members require supervision',
              'Team lacks glass installation experience',
              'Insufficient qualified personnel'
            ],
            critical: true,
            notes: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'personnel_safety',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-15',
            question: 'Required PPE for Glass Installation',
            options: [
              'Cut-resistant gloves (Level A5)',
              'Safety harnesses with shock absorbers',
              'Hard hats with chin straps',
              'Safety glasses with side shields',
              'Steel-toed boots with slip resistance',
              'High-visibility clothing',
              'All PPE verified and available'
            ],
            critical: true,
            notes: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'personnel_safety',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-16',
            question: 'Communication Systems',
            options: [
              'Two-way radios for all team members',
              'Hand signals established and practiced',
              'Emergency communication plan in place',
              'Backup communication methods available',
              'Communication systems tested',
              'Inadequate communication capabilities'
            ],
            critical: true,
            aiWeight: 7,
            riskCategory: 'personnel_safety',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Emergency Preparedness',
        description: 'Emergency response planning for glass installation',
        items: [
          {
            id: 'sa-17',
            question: 'Emergency Response Equipment',
            options: [
              'First aid kits stocked and accessible',
              'Emergency descent devices ready',
              'Rescue equipment on standby',
              'Emergency communication devices functional',
              'Evacuation routes clearly marked',
              'Emergency equipment needs attention'
            ],
            critical: true,
            notes: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'emergency_preparedness',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-18',
            question: 'Emergency Response Plan Status',
            options: [
              'All personnel briefed on emergency procedures',
              'Rescue team on standby',
              'Emergency contacts verified',
              'Hospital/medical facilities identified',
              'Emergency plan requires updates',
              'No emergency plan in place'
            ],
            critical: true,
            notes: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'emergency_preparedness',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Public Safety and Site Security',
        description: 'Protection of public and site security measures',
        items: [
          {
            id: 'sa-19',
            question: 'Ground Level Protection Systems',
            options: [
              'Overhead protection canopy installed',
              'Perimeter barriers and warning signs',
              'Flaggers positioned at key locations',
              'Public walkway diversions in place',
              'Protection systems need enhancement',
              'Inadequate public protection'
            ],
            critical: true,
            notes: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'public_safety',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'sa-20',
            question: 'Adjacent Property Protection',
            options: [
              'Neighboring buildings fully protected',
              'Property owners notified of operations',
              'Protection measures coordinated',
              'Additional protection measures needed',
              'Some properties at risk',
              'Inadequate adjacent property protection'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'public_safety',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      }
    ]
  },
  'fall-protection': {
    title: 'Fall Protection Systems Checklist',
    description: 'Comprehensive fall protection assessment for glass installation work',
    aiContext: 'Fall protection is critical for glass installation work at height. This checklist covers personal fall arrest systems, guardrails, safety nets, and positioning systems specific to glass installation operations.',
    sections: [
      {
        title: 'Personal Fall Arrest Systems (PFAS)',
        description: 'Individual fall protection equipment and systems',
        items: [
          {
            id: 'fp-1',
            question: 'Full Body Harness Inspection and Fit',
            options: [
              'Harnesses inspected and properly fitted',
              'All hardware functional and secure',
              'Harnesses free from cuts, burns, or wear',
              'Some harnesses need replacement',
              'Harnesses not properly fitted',
              'Harnesses failed inspection'
            ],
            notes: true,
            critical: true,
            images: true,
            deadline: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-2',
            question: 'Shock Absorbing Lanyards',
            options: [
              'Shock absorbers inspected and functional',
              'Proper length for work positioning',
              'Lanyards free from damage',
              'Backup lanyards available',
              'Some lanyards need replacement',
              'Lanyards inadequate for glass work'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-3',
            question: 'Anchor Point Certification',
            options: [
              'Anchor points certified for 5,000 lbs per worker',
              'Structural engineer approval documented',
              'Anchor points properly positioned',
              'Temporary anchors properly installed',
              'Anchor points need verification',
              'Anchor points inadequate or uncertified'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-4',
            question: 'Self-Retracting Lifelines (SRL)',
            options: [
              'SRLs inspected and certified',
              'Proper SRL type for glass work',
              'SRLs positioned to minimize swing fall',
              'Rescue capability considered',
              'SRLs need maintenance',
              'SRLs inappropriate for application'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          }
        ]
      },
      {
        title: 'Guardrail Systems',
        description: 'Passive fall protection through guardrails',
        items: [
          {
            id: 'fp-5',
            question: 'Guardrail Height and Strength',
            options: [
              'Top rails at 42 inches (±3 inches)',
              'Guardrails withstand 200 lbs force',
              'Midrails at 21 inches height',
              'Guardrails properly secured',
              'Guarrails need adjustment',
              'Guardrails do not meet standards'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-6',
            question: 'Guardrail Coverage and Gaps',
            options: [
              'All open sides and edges protected',
              'No gaps greater than 19 inches',
              'Removable sections properly secured',
              'Temporary openings properly protected',
              'Some gaps need attention',
              'Inadequate guardrail coverage'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-7',
            question: 'Toeboards and Debris Protection',
            options: [
              'Toeboards installed where required',
              'Minimum 3.5 inch height maintained',
              'Debris screens installed as needed',
              'Protection adequate for glass work',
              'Toeboards need improvement',
              'Inadequate debris protection'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          }
        ]
      },
      {
        title: 'Safety Net Systems',
        description: 'Safety nets for glass installation operations',
        items: [
          {
            id: 'fp-8',
            question: 'Safety Net Installation and Testing',
            options: [
              'Nets properly installed and tensioned',
              'Drop test performed and documented',
              'Net mesh and materials certified',
              'Proper clearance below nets maintained',
              'Nets need adjustment or repair',
              'Safety nets inadequate or missing'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-9',
            question: 'Net Positioning for Glass Work',
            options: [
              'Nets positioned to catch falling workers',
              'Nets extend sufficiently beyond work area',
              'No obstructions in net area',
              'Nets positioned for glass panel protection',
              'Net positioning needs improvement',
              'Nets poorly positioned for glass work'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          }
        ]
      },
      {
        title: 'Training and Competency',
        description: 'Worker training and competency verification',
        items: [
          {
            id: 'fp-10',
            question: 'Fall Protection Training Verification',
            options: [
              'All workers trained in fall protection use',
              'Training specific to glass installation',
              'Rescue procedures training completed',
              'Training documentation current',
              'Some workers need refresher training',
              'Inadequate fall protection training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fp-11',
            question: 'Competent Person Designation',
            options: [
              'Competent person identified and trained',
              'Authority to stop unsafe work',
              'Regular inspection schedule maintained',
              'Competent person available on site',
              'Competent person needs additional training',
              'No competent person designated'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.502'
          }
        ]
      }
    ]
  },
  'electrical-safety': {
    title: 'Electrical Safety for Glass Installation',
    description: 'Electrical safety assessment for glass installation operations',
    aiContext: 'Electrical safety during glass installation involves power tools, temporary lighting, crane operations near power lines, and electrical systems in buildings under construction.',
    sections: [
      {
        title: 'Power Line Proximity and Clearances',
        description: 'Safety around overhead and underground electrical systems',
        items: [
          {
            id: 'es-1',
            question: 'Overhead Power Line Assessment',
            options: [
              'No overhead power lines in work area',
              'Power lines identified and marked',
              'Minimum clearances maintained (10+ feet)',
              'Power company notified of operations',
              'Power lines pose potential hazard',
              'Inadequate clearance from power lines'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.1408'
          },
          {
            id: 'es-2',
            question: 'Underground Utilities Location',
            options: [
              'Underground utilities located and marked',
              '811 call completed before excavation',
              'Utility clearances verified',
              'Hand digging required near utilities',
              'Utility locations uncertain',
              'Underground utilities not located'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.651'
          },
          {
            id: 'es-3',
            question: 'Crane and Equipment Electrical Safety',
            options: [
              'Crane operators trained in electrical safety',
              'Minimum approach distances established',
              'Spotter assigned for electrical hazards',
              'Equipment grounding verified',
              'Electrical safety plan needs improvement',
              'Inadequate electrical safety measures'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.1408'
          }
        ]
      },
      {
        title: 'Temporary Electrical Systems',
        description: 'Temporary power and lighting for glass installation',
        items: [
          {
            id: 'es-4',
            question: 'Temporary Power Distribution',
            options: [
              'GFCI protection on all circuits',
              'Proper grounding system installed',
              'Electrical panels properly labeled',
              'Cords and connections in good condition',
              'Temporary power needs improvement',
              'Electrical hazards present'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.404'
          },
          {
            id: 'es-5',
            question: 'Extension Cords and Portable Equipment',
            options: [
              'Extension cords rated for outdoor use',
              'Cords inspected for damage',
              'Proper cord management and protection',
              'Equipment double insulated or grounded',
              'Cord conditions need attention',
              'Electrical cords present hazards'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.405'
          },
          {
            id: 'es-6',
            question: 'Temporary Lighting Systems',
            options: [
              'Adequate lighting for glass work',
              'Lighting fixtures properly secured',
              'Emergency lighting available',
              'Lighting controls accessible',
              'Lighting system needs improvement',
              'Inadequate lighting for safe work'
            ],
            notes: true,
            images: true,
            aiWeight: 6,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.56'
          }
        ]
      },
      {
        title: 'Personal Protective Equipment',
        description: 'Electrical PPE for glass installation workers',
        items: [
          {
            id: 'es-7',
            question: 'Electrical PPE Availability',
            options: [
              'Insulated gloves available and tested',
              'Dielectric footwear provided',
              'Arc flash protection available',
              'Insulated tools for electrical work',
              'PPE needs updating or replacement',
              'Inadequate electrical PPE'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'electrical_ppe',
            complianceStandard: 'OSHA 1926.97'
          },
          {
            id: 'es-8',
            question: 'PPE Testing and Certification',
            options: [
              'PPE testing current and documented',
              'Proper voltage ratings verified',
              'PPE inspection schedule maintained',
              'Workers trained in PPE use',
              'PPE testing overdue',
              'PPE testing inadequate or missing'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'electrical_ppe',
            complianceStandard: 'OSHA 1926.97'
          }
        ]
      },
      {
        title: 'Lockout/Tagout Procedures',
        description: 'Energy isolation for glass installation work',
        items: [
          {
            id: 'es-9',
            question: 'LOTO Program Implementation',
            options: [
              'Written LOTO procedures available',
              'Authorized personnel identified',
              'LOTO devices available and used',
              'Verification procedures followed',
              'LOTO program needs improvement',
              'No LOTO program in place'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'energy_isolation',
            complianceStandard: 'OSHA 1926.417'
          },
          {
            id: 'es-10',
            question: 'Energy Source Identification',
            options: [
              'All energy sources identified',
              'Isolation points clearly marked',
              'Multiple energy sources considered',
              'Stored energy addressed',
              'Energy source identification incomplete',
              'Energy sources not properly identified'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'energy_isolation',
            complianceStandard: 'OSHA 1926.417'
          }
        ]
      }
    ]
  },
  'hazard-communication': {
    title: 'Hazard Communication for Glass Installation',
    description: 'Chemical hazard communication and safety data management',
    aiContext: 'Glass installation involves various chemicals including sealants, adhesives, cleaning agents, and protective coatings. Proper hazard communication ensures worker safety and regulatory compliance.',
    sections: [
      {
        title: 'Chemical Inventory and Documentation',
        description: 'Comprehensive chemical inventory and safety documentation',
        items: [
          {
            id: 'hc-1',
            question: 'Chemical Inventory Completeness',
            options: [
              'Complete inventory of all chemicals on site',
              'Sealants and adhesives documented',
              'Cleaning agents and solvents listed',
              'Protective coatings and treatments included',
              'Inventory partially complete',
              'Chemical inventory missing or inadequate'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'chemical_management',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-2',
            question: 'Safety Data Sheets (SDS) Availability',
            options: [
              'Current SDS for all chemicals available',
              'SDS easily accessible to workers',
              'SDS in language workers understand',
              'Electronic SDS system functional',
              'Some SDS missing or outdated',
              'SDS inadequate or inaccessible'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'chemical_management',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-3',
            question: 'Container Labeling System',
            options: [
              'All containers properly labeled',
              'GHS-compliant labels used',
              'Secondary container labeling complete',
              'Labels legible and intact',
              'Some labeling deficiencies',
              'Inadequate container labeling'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'chemical_management',
            complianceStandard: 'OSHA 1926.59'
          }
        ]
      },
      {
        title: 'Glass Installation Specific Chemicals',
        description: 'Chemicals commonly used in glass installation work',
        items: [
          {
            id: 'hc-4',
            question: 'Structural Glazing Sealants',
            options: [
              'Silicone sealants properly stored',
              'Ventilation adequate for sealant use',
              'Skin contact protection measures',
              'Curing time and safety considerations',
              'Sealant safety measures need improvement',
              'Inadequate sealant safety protocols'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'chemical_exposure',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-5',
            question: 'Glass Cleaning and Preparation Chemicals',
            options: [
              'Cleaning solvents properly managed',
              'Vapor exposure controls in place',
              'Skin and eye protection provided',
              'Waste disposal procedures established',
              'Chemical safety needs improvement',
              'Inadequate chemical safety measures'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'chemical_exposure',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-6',
            question: 'Adhesives and Bonding Agents',
            options: [
              'Adhesive safety protocols established',
              'Proper mixing and application procedures',
              'Respiratory protection when required',
              'Fire and explosion hazards addressed',
              'Adhesive safety needs attention',
              'Inadequate adhesive safety measures'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'chemical_exposure',
            complianceStandard: 'OSHA 1926.59'
          }
        ]
      },
      {
        title: 'Worker Training and Communication',
        description: 'Training and communication of chemical hazards',
        items: [
          {
            id: 'hc-7',
            question: 'HazCom Training Program',
            options: [
              'All workers trained on chemical hazards',
              'Training specific to glass installation chemicals',
              'Training documentation current',
              'Refresher training scheduled',
              'Training program needs improvement',
              'Inadequate hazcom training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-8',
            question: 'Chemical Emergency Procedures',
            options: [
              'Emergency procedures posted and known',
              'Spill response materials available',
              'Emergency contacts readily available',
              'First aid procedures for chemical exposure',
              'Emergency procedures need improvement',
              'Inadequate emergency procedures'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'emergency_preparedness',
            complianceStandard: 'OSHA 1926.59'
          }
        ]
      },
      {
        title: 'Storage and Handling Procedures',
        description: 'Safe storage and handling of chemicals',
        items: [
          {
            id: 'hc-9',
            question: 'Chemical Storage Compatibility',
            options: [
              'Incompatible chemicals properly separated',
              'Storage areas well-ventilated',
              'Temperature controls maintained',
              'Secondary containment provided',
              'Storage practices need improvement',
              'Inadequate chemical storage'
            ],
            notes: true,
            images: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'chemical_storage',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'hc-10',
            question: 'Chemical Waste Management',
            options: [
              'Waste disposal procedures established',
              'Waste containers properly labeled',
              'Hazardous waste manifests current',
              'Disposal contractor qualified',
              'Waste management needs improvement',
              'Inadequate waste management'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'chemical_storage',
            complianceStandard: 'OSHA 1926.59'
          }
        ]
      }
    ]
  },
  'respiratory-protection': {
    title: 'Respiratory Protection for Glass Installation',
    description: 'Respiratory protection assessment for glass installation operations',
    aiContext: 'Glass installation may involve exposure to silica dust, chemical vapors from sealants and adhesives, and other airborne contaminants requiring respiratory protection.',
    sections: [
      {
        title: 'Exposure Assessment and Monitoring',
        description: 'Assessment of respiratory hazards in glass installation',
        items: [
          {
            id: 'rp-1',
            question: 'Silica Dust Exposure Assessment',
            options: [
              'Silica exposure assessment completed',
              'Dust control measures implemented',
              'Air monitoring conducted',
              'Exposure levels below PEL',
              'Exposure assessment needs updating',
              'Silica exposure not assessed'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'respiratory_hazards',
            complianceStandard: 'OSHA 1926.1153'
          },
          {
            id: 'rp-2',
            question: 'Chemical Vapor Exposure',
            options: [
              'Sealant and adhesive vapor exposure assessed',
              'Ventilation controls adequate',
              'Vapor monitoring conducted',
              'Exposure controls effective',
              'Vapor exposure needs attention',
              'Chemical vapor exposure not controlled'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'respiratory_hazards',
            complianceStandard: 'OSHA 1926.59'
          },
          {
            id: 'rp-3',
            question: 'Confined Space Respiratory Hazards',
            options: [
              'Confined space atmospheric testing',
              'Ventilation systems operational',
              'Oxygen levels monitored',
              'Toxic gas detection available',
              'Atmospheric monitoring needs improvement',
              'Confined space hazards not assessed'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'respiratory_hazards',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      },
      {
        title: 'Respirator Selection and Fit Testing',
        description: 'Proper respirator selection and fit testing procedures',
        items: [
          {
            id: 'rp-4',
            question: 'Respirator Selection Appropriateness',
            options: [
              'Respirators appropriate for identified hazards',
              'NIOSH approved respirators used',
              'Protection factors adequate',
              'Respirator types match exposure levels',
              'Respirator selection needs review',
              'Inappropriate respirator selection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'respiratory_protection',
            complianceStandard: 'OSHA 1926.103'
          },
          {
            id: 'rp-5',
            question: 'Fit Testing Program',
            options: [
              'Annual fit testing completed',
              'Quantitative fit testing performed',
              'Fit testing records maintained',
              'Different respirator models tested',
              'Fit testing overdue',
              'No fit testing program'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'respiratory_protection',
            complianceStandard: 'OSHA 1926.103'
          },
          {
            id: 'rp-6',
            question: 'Medical Evaluation Program',
            options: [
              'Medical evaluations current',
              'Physician approval documented',
              'Medical surveillance program active',
              'Fitness for respirator use verified',
              'Medical evaluations overdue',
              'No medical evaluation program'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'respiratory_protection',
            complianceStandard: 'OSHA 1926.103'
          }
        ]
      },
      {
        title: 'Respirator Maintenance and Care',
        description: 'Proper maintenance and care of respiratory equipment',
        items: [
          {
            id: 'rp-7',
            question: 'Cleaning and Sanitization',
            options: [
              'Regular cleaning schedule maintained',
              'Proper sanitization procedures followed',
              'Cleaning supplies adequate',
              'Storage conditions appropriate',
              'Cleaning procedures need improvement',
              'Inadequate respirator maintenance'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'equipment_maintenance',
            complianceStandard: 'OSHA 1926.103'
          },
          {
            id: 'rp-8',
            question: 'Filter and Cartridge Management',
            options: [
              'Change schedule based on exposure',
              'Proper filter/cartridge selection',
              'End-of-service-life indicators used',
              'Inventory management adequate',
              'Filter management needs improvement',
              'Inadequate filter/cartridge program'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'equipment_maintenance',
            complianceStandard: 'OSHA 1926.103'
          },
          {
            id: 'rp-9',
            question: 'Inspection and Defect Identification',
            options: [
              'Pre-use inspection procedures',
              'Defect identification training',
              'Damaged equipment removed from service',
              'Inspection records maintained',
              'Inspection procedures need improvement',
              'Inadequate inspection program'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'equipment_maintenance',
            complianceStandard: 'OSHA 1926.103'
          }
        ]
      },
      {
        title: 'Training and Program Administration',
        description: 'Training and administrative aspects of respiratory protection',
        items: [
          {
            id: 'rp-10',
            question: 'Respiratory Protection Training',
            options: [
              'Comprehensive training program implemented',
              'Training specific to glass installation hazards',
              'Hands-on training provided',
              'Training documentation current',
              'Training program needs enhancement',
              'Inadequate respiratory protection training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.103'
          },
          {
            id: 'rp-11',
            question: 'Program Administrator Designation',
            options: [
              'Qualified program administrator designated',
              'Administrator training current',
              'Program oversight adequate',
              'Regular program evaluation conducted',
              'Program administration needs improvement',
              'No designated program administrator'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'program_management',
            complianceStandard: 'OSHA 1926.103'
          }
        ]
      }
    ]
  },
  'ppe': {
    title: 'Personal Protective Equipment for Glass Installation',
    description: 'Comprehensive PPE assessment for glass installation operations',
    aiContext: 'Glass installation requires specialized PPE including cut-resistant gloves, safety glasses, fall protection, and protection from chemical exposure. PPE selection must consider the unique hazards of handling large glass panels at height.',
    sections: [
      {
        title: 'PPE Hazard Assessment',
        description: 'Comprehensive assessment of PPE needs for glass installation',
        items: [
          {
            id: 'ppe-1',
            question: 'Glass Handling Hazard Assessment',
            options: [
              'Cut and laceration hazards assessed',
              'Impact and penetration risks evaluated',
              'Chemical exposure hazards identified',
              'Fall hazards comprehensively assessed',
              'Hazard assessment needs updating',
              'Inadequate hazard assessment'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'hazard_assessment',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-2',
            question: 'Job-Specific PPE Requirements',
            options: [
              'PPE requirements documented for each task',
              'Different glass types considered',
              'Height-specific requirements addressed',
              'Weather condition factors included',
              'PPE requirements need clarification',
              'Job-specific requirements not defined'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'hazard_assessment',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Hand and Arm Protection',
        description: 'Protection for hands and arms during glass handling',
        items: [
          {
            id: 'ppe-3',
            question: 'Cut-Resistant Gloves',
            options: [
              'ANSI A5 cut-resistant gloves available',
              'Gloves appropriate for glass thickness',
              'Puncture resistance adequate',
              'Dexterity sufficient for glass work',
              'Glove selection needs improvement',
              'Inadequate cut-resistant gloves'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'hand_protection',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-4',
            question: 'Chemical-Resistant Gloves',
            options: [
              'Chemical-resistant gloves for sealant work',
              'Proper glove material selection',
              'Breakthrough time adequate',
              'Glove inspection procedures',
              'Chemical glove program needs improvement',
              'Inadequate chemical-resistant gloves'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'hand_protection',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-5',
            question: 'Arm and Sleeve Protection',
            options: [
              'Cut-resistant sleeves available',
              'Arm protection for large glass handling',
              'Protection extends to shoulders when needed',
              'Sleeve protection compatible with other PPE',
              'Arm protection needs enhancement',
              'Inadequate arm protection'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'hand_protection',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Eye and Face Protection',
        description: 'Protection for eyes and face during glass installation',
        items: [
          {
            id: 'ppe-6',
            question: 'Safety Glasses and Goggles',
            options: [
              'ANSI Z87.1 compliant safety glasses',
              'Side shields or wraparound design',
              'Impact resistance appropriate',
              'Prescription safety glasses available',
              'Eye protection needs improvement',
              'Inadequate eye protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'eye_protection',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-7',
            question: 'Face Shields and Full Face Protection',
            options: [
              'Face shields for grinding operations',
              'Full face protection for chemical work',
              'Anti-fog and scratch-resistant coatings',
              'Compatibility with other PPE',
              'Face protection needs enhancement',
              'Inadequate face protection'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'eye_protection',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Head Protection',
        description: 'Head protection for glass installation work',
        items: [
          {
            id: 'ppe-8',
            question: 'Hard Hat Selection and Use',
            options: [
              'ANSI Z89.1 compliant hard hats',
              'Type I or Type II as appropriate',
              'Chin straps for work at height',
              'Electrical protection when required',
              'Hard hat program needs improvement',
              'Inadequate head protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'head_protection',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-9',
            question: 'Hard Hat Maintenance and Inspection',
            options: [
              'Regular inspection procedures',
              'Replacement schedule established',
              'Damage identification training',
              'Proper cleaning and storage',
              'Maintenance procedures need improvement',
              'Inadequate hard hat maintenance'
            ],
            notes: true,
            aiWeight: 6,
            riskCategory: 'head_protection',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Foot Protection',
        description: 'Foot protection for glass installation operations',
        items: [
          {
            id: 'ppe-10',
            question: 'Safety Footwear Requirements',
            options: [
              'ASTM F2413 compliant safety shoes',
              'Puncture-resistant soles',
              'Slip-resistant outsoles',
              'Electrical hazard protection when needed',
              'Footwear selection needs improvement',
              'Inadequate foot protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'foot_protection',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-11',
            question: 'Specialized Footwear for Glass Work',
            options: [
              'Non-slip soles for glass surfaces',
              'Ankle support for uneven surfaces',
              'Comfort for extended wear',
              'Compatibility with fall protection',
              'Specialized footwear needs consideration',
              'Footwear inappropriate for glass work'
            ],
            notes: true,
            aiWeight: 6,
            riskCategory: 'foot_protection',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Training and Compliance',
        description: 'PPE training and compliance verification',
        items: [
          {
            id: 'ppe-12',
            question: 'PPE Training Program',
            options: [
              'Comprehensive PPE training provided',
              'Training specific to glass installation',
              'Proper use and maintenance covered',
              'Training documentation current',
              'Training program needs enhancement',
              'Inadequate PPE training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'ppe-13',
            question: 'PPE Compliance Monitoring',
            options: [
              'Regular compliance inspections',
              'Enforcement procedures established',
              'Non-compliance addressed promptly',
              'Compliance records maintained',
              'Compliance monitoring needs improvement',
              'Inadequate compliance monitoring'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'program_management',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      }
    ]
  },
  'confined-space': {
    title: 'Confined Space Entry for Glass Installation',
    description: 'Confined space entry procedures for glass installation work',
    aiContext: 'Glass installation may require entry into confined spaces such as mechanical rooms, elevator shafts, or enclosed building areas during construction. Proper confined space procedures are critical for worker safety.',
    sections: [
      {
        title: 'Space Classification and Evaluation',
        description: 'Proper classification and evaluation of confined spaces',
        items: [
          {
            id: 'cs-1',
            question: 'Confined Space Identification',
            options: [
              'All confined spaces identified and marked',
              'Permit-required spaces properly classified',
              'Non-permit spaces verified safe',
              'Space characteristics documented',
              'Space identification needs improvement',
              'Confined spaces not properly identified'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'space_classification',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-2',
            question: 'Atmospheric Hazard Assessment',
            options: [
              'Atmospheric testing completed',
              'Oxygen levels verified (19.5-23.5%)',
              'Toxic gas levels below PEL',
              'Flammable gas levels below 10% LFL',
              'Atmospheric conditions need monitoring',
              'Atmospheric hazards not assessed'
            ],
            notes: true,
            critical: true,
            aiWeight: 10,
            riskCategory: 'atmospheric_hazards',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-3',
            question: 'Physical Hazard Evaluation',
            options: [
              'Engulfment hazards assessed',
              'Configuration hazards identified',
              'Mechanical hazards evaluated',
              'Temperature extremes considered',
              'Physical hazards need attention',
              'Physical hazards not properly assessed'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'physical_hazards',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      },
      {
        title: 'Entry Permit System',
        description: 'Permit system for confined space entry',
        items: [
          {
            id: 'cs-4',
            question: 'Entry Permit Procedures',
            options: [
              'Written entry permits required',
              'Permit system properly implemented',
              'Entry supervisor designated',
              'Permit conditions verified',
              'Permit system needs improvement',
              'No entry permit system'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'permit_system',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-5',
            question: 'Pre-Entry Safety Measures',
            options: [
              'Isolation and lockout completed',
              'Atmospheric testing current',
              'Ventilation systems operational',
              'Emergency equipment ready',
              'Pre-entry measures need attention',
              'Inadequate pre-entry safety measures'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'permit_system',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-6',
            question: 'Continuous Monitoring Requirements',
            options: [
              'Continuous atmospheric monitoring',
              'Monitoring equipment calibrated',
              'Alarm systems functional',
              'Monitoring records maintained',
              'Monitoring procedures need improvement',
              'Inadequate continuous monitoring'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'monitoring',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      },
      {
        title: 'Ventilation and Atmospheric Control',
        description: 'Ventilation systems for confined space safety',
        items: [
          {
            id: 'cs-7',
            question: 'Mechanical Ventilation Systems',
            options: [
              'Adequate ventilation provided',
              'Ventilation equipment properly sized',
              'Air flow patterns appropriate',
              'Ventilation effectiveness verified',
              'Ventilation system needs improvement',
              'Inadequate ventilation'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'ventilation',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-8',
            question: 'Emergency Ventilation Procedures',
            options: [
              'Emergency ventilation plan established',
              'Backup ventilation equipment available',
              'Emergency shutdown procedures',
              'Ventilation failure response plan',
              'Emergency procedures need development',
              'No emergency ventilation procedures'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'ventilation',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      },
      {
        title: 'Rescue and Emergency Procedures',
        description: 'Emergency rescue procedures for confined spaces',
        items: [
          {
            id: 'cs-9',
            question: 'Rescue Team and Equipment',
            options: [
              'Trained rescue team available',
              'Rescue equipment ready and tested',
              'Non-entry rescue methods preferred',
              'Emergency services contacted',
              'Rescue capabilities need improvement',
              'Inadequate rescue preparations'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'emergency_rescue',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-10',
            question: 'Communication Systems',
            options: [
              'Reliable communication established',
              'Attendant maintains contact',
              'Emergency communication methods',
              'Communication equipment tested',
              'Communication system needs improvement',
              'Inadequate communication systems'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'emergency_rescue',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      },
      {
        title: 'Training and Competency',
        description: 'Training requirements for confined space work',
        items: [
          {
            id: 'cs-11',
            question: 'Entrant Training Program',
            options: [
              'Entrants properly trained',
              'Training covers glass installation hazards',
              'Emergency procedures training',
              'Training documentation current',
              'Training program needs enhancement',
              'Inadequate entrant training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.1203'
          },
          {
            id: 'cs-12',
            question: 'Attendant and Supervisor Training',
            options: [
              'Attendants properly trained',
              'Entry supervisors qualified',
              'Rescue training completed',
              'Training records maintained',
              'Training needs updating',
              'Inadequate attendant/supervisor training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.1203'
          }
        ]
      }
    ]
  },
  'fire-prevention': {
    title: 'Fire Prevention for Glass Installation',
    description: 'Fire prevention and protection measures for glass installation operations',
    aiContext: 'Glass installation involves hot work, flammable materials, and electrical equipment that create fire hazards. Proper fire prevention measures are essential for worker and public safety.',
    sections: [
      {
        title: 'Hot Work and Ignition Source Control',
        description: 'Control of ignition sources during glass installation',
        items: [
          {
            id: 'fp-1',
            question: 'Hot Work Permit System',
            options: [
              'Hot work permits required and issued',
              'Fire watch assigned for hot work',
              'Hot work areas properly prepared',
              'Permit conditions verified',
              'Hot work permit system needs improvement',
              'No hot work permit system'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'ignition_control',
            complianceStandard: 'OSHA 1926.352'
          },
          {
            id: 'fp-2',
            question: 'Welding and Cutting Operations',
            options: [
              'Welding areas properly ventilated',
              'Combustible materials removed or protected',
              'Fire extinguishers readily available',
              'Post-work fire watch maintained',
              'Welding safety needs improvement',
              'Inadequate welding fire safety'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'ignition_control',
            complianceStandard: 'OSHA 1926.352'
          },
          {
            id: 'fp-3',
            question: 'Electrical Equipment Fire Safety',
            options: [
              'Electrical equipment properly maintained',
              'GFCI protection prevents electrical fires',
              'Extension cords in good condition',
              'Electrical panels accessible',
              'Electrical fire safety needs attention',
              'Electrical fire hazards present'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'ignition_control',
            complianceStandard: 'OSHA 1926.404'
          }
        ]
      },
      {
        title: 'Flammable and Combustible Materials',
        description: 'Management of flammable materials in glass installation',
        items: [
          {
            id: 'fp-4',
            question: 'Sealant and Adhesive Storage',
            options: [
              'Flammable materials properly stored',
              'Storage areas well-ventilated',
              'Ignition sources eliminated from storage',
              'Quantity limits observed',
              'Storage practices need improvement',
              'Inadequate flammable material storage'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'flammable_materials',
            complianceStandard: 'OSHA 1926.152'
          },
          {
            id: 'fp-5',
            question: 'Solvent and Cleaning Agent Management',
            options: [
              'Solvents stored in approved containers',
              'Vapor control measures implemented',
              'Waste disposal procedures followed',
              'Static electricity controls in place',
              'Solvent management needs improvement',
              'Inadequate solvent fire safety'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'flammable_materials',
            complianceStandard: 'OSHA 1926.152'
          },
          {
            id: 'fp-6',
            question: 'Combustible Construction Materials',
            options: [
              'Combustible materials protected or removed',
              'Temporary protection measures in place',
              'Material separation distances maintained',
              'Fire-resistant barriers installed',
              'Combustible material protection needed',
              'Inadequate combustible material control'
            ],
            notes: true,
            images: true,
            aiWeight: 6,
            riskCategory: 'flammable_materials',
            complianceStandard: 'OSHA 1926.152'
          }
        ]
      },
      {
        title: 'Fire Protection Systems',
        description: 'Fire detection and suppression systems',
        items: [
          {
            id: 'fp-7',
            question: 'Portable Fire Extinguishers',
            options: [
              'Appropriate extinguishers available',
              'Extinguishers properly maintained',
              'Extinguisher locations marked',
              'Workers trained in extinguisher use',
              'Fire extinguisher program needs improvement',
              'Inadequate portable fire protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'fire_protection_systems',
            complianceStandard: 'OSHA 1926.150'
          },
          {
            id: 'fp-8',
            question: 'Fixed Fire Protection Systems',
            options: [
              'Sprinkler systems operational',
              'Fire alarm systems functional',
              'Standpipe systems available',
              'Fire protection systems tested',
              'Fixed systems need attention',
              'Inadequate fixed fire protection'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'fire_protection_systems',
            complianceStandard: 'OSHA 1926.150'
          },
          {
            id: 'fp-9',
            question: 'Water Supply and Access',
            options: [
              'Adequate water supply available',
              'Fire department access maintained',
              'Hydrant locations known',
              'Water pressure adequate',
              'Water supply needs verification',
              'Inadequate water supply for fire fighting'
            ],
            notes: true,
            images: true,
            aiWeight: 6,
            riskCategory: 'fire_protection_systems',
            complianceStandard: 'OSHA 1926.150'
          }
        ]
      },
      {
        title: 'Emergency Evacuation and Response',
        description: 'Fire emergency evacuation and response procedures',
        items: [
          {
            id: 'fp-10',
            question: 'Evacuation Routes and Procedures',
            options: [
              'Evacuation routes clearly marked',
              'Routes kept clear and unobstructed',
              'Assembly points designated',
              'Evacuation procedures practiced',
              'Evacuation planning needs improvement',
              'Inadequate evacuation procedures'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'emergency_response',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'fp-11',
            question: 'Fire Emergency Communication',
            options: [
              'Fire alarm systems functional',
              'Emergency communication plan established',
              'Fire department contact procedures',
              'Worker notification methods',
              'Communication procedures need improvement',
              'Inadequate fire emergency communication'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'emergency_response',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Training and Fire Safety Management',
        description: 'Fire safety training and management programs',
        items: [
          {
            id: 'fp-12',
            question: 'Fire Safety Training Program',
            options: [
              'Comprehensive fire safety training',
              'Training specific to glass installation hazards',
              'Fire extinguisher training provided',
              'Emergency response training current',
              'Fire safety training needs enhancement',
              'Inadequate fire safety training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'fp-13',
            question: 'Fire Safety Program Management',
            options: [
              'Fire safety program established',
              'Regular fire safety inspections',
              'Fire safety responsibilities assigned',
              'Program effectiveness evaluated',
              'Fire safety program needs development',
              'No fire safety program'
            ],
            notes: true,
            critical: true,
            aiWeight: 6,
            riskCategory: 'program_management',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      }
    ]
  },
  'emergency-action': {
    title: 'Emergency Action Plan for Glass Installation',
    description: 'Comprehensive emergency action planning for glass installation operations',
    aiContext: 'Glass installation operations require comprehensive emergency planning due to work at height, heavy materials, and potential for serious injuries. Emergency action plans must address medical emergencies, evacuations, and incident response.',
    sections: [
      {
        title: 'Emergency Action Plan Development',
        description: 'Development and documentation of emergency procedures',
        items: [
          {
            id: 'eap-1',
            question: 'Written Emergency Action Plan',
            options: [
              'Comprehensive written plan available',
              'Plan specific to glass installation hazards',
              'Plan covers all potential emergencies',
              'Plan regularly reviewed and updated',
              'Emergency plan needs improvement',
              'No written emergency action plan'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 10,
            riskCategory: 'emergency_planning',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-2',
            question: 'Emergency Procedures Documentation',
            options: [
              'Step-by-step emergency procedures',
              'Procedures for different emergency types',
              'Contact information current',
              'Procedures easily accessible',
              'Procedures need updating',
              'Emergency procedures inadequate'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'emergency_planning',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-3',
            question: 'Emergency Coordinator Designation',
            options: [
              'Emergency coordinator designated',
              'Coordinator authority clearly defined',
              'Backup coordinators identified',
              'Coordinator training current',
              'Emergency coordination needs improvement',
              'No emergency coordinator designated'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'emergency_planning',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Medical Emergency Response',
        description: 'Medical emergency response for glass installation injuries',
        items: [
          {
            id: 'eap-4',
            question: 'First Aid and Medical Response',
            options: [
              'Trained first aid personnel on site',
              'First aid supplies adequate for glass injuries',
              'Medical emergency procedures established',
              'Hospital/medical facility contacts current',
              'Medical response needs improvement',
              'Inadequate medical emergency response'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'medical_emergency',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-5',
            question: 'Severe Injury Response Procedures',
            options: [
              'Procedures for severe cuts and lacerations',
              'Fall injury response protocols',
              'Crush injury emergency procedures',
              'Spinal injury immobilization procedures',
              'Severe injury procedures need development',
              'Inadequate severe injury response'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'medical_emergency',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-6',
            question: 'Emergency Medical Equipment',
            options: [
              'Trauma first aid kits available',
              'Spinal immobilization equipment',
              'Emergency oxygen available',
              'AED accessible if required',
              'Medical equipment needs enhancement',
              'Inadequate emergency medical equipment'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'medical_emergency',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Evacuation Procedures',
        description: 'Emergency evacuation procedures for glass installation sites',
        items: [
          {
            id: 'eap-7',
            question: 'Evacuation Route Planning',
            options: [
              'Primary evacuation routes identified',
              'Alternative routes planned',
              'Routes appropriate for injured workers',
              'Routes clear and well-marked',
              'Evacuation routes need improvement',
              'Inadequate evacuation route planning'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'evacuation',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-8',
            question: 'High-Rise Evacuation Procedures',
            options: [
              'Procedures for evacuation from height',
              'Emergency descent devices available',
              'Rescue team capabilities defined',
              'Helicopter landing zone identified',
              'High-rise evacuation needs development',
              'Inadequate high-rise evacuation procedures'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'evacuation',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-9',
            question: 'Assembly and Accountability',
            options: [
              'Assembly areas designated',
              'Accountability procedures established',
              'Personnel tracking system',
              'Assembly area safety verified',
              'Assembly procedures need improvement',
              'Inadequate assembly and accountability'
            ],
            notes: true,
            images: true,
            aiWeight: 7,
            riskCategory: 'evacuation',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Communication and Notification',
        description: 'Emergency communication and notification systems',
        items: [
          {
            id: 'eap-10',
            question: 'Emergency Communication Systems',
            options: [
              'Reliable communication systems available',
              'Multiple communication methods',
              'Communication systems tested regularly',
              'Backup communication methods',
              'Communication systems need improvement',
              'Inadequate emergency communication'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'communication',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-11',
            question: 'Emergency Notification Procedures',
            options: [
              'Emergency services notification procedures',
              'Management notification protocols',
              'Family notification procedures',
              'Regulatory notification requirements',
              'Notification procedures need improvement',
              'Inadequate emergency notification'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'communication',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Training and Drills',
        description: 'Emergency response training and drill programs',
        items: [
          {
            id: 'eap-12',
            question: 'Emergency Response Training',
            options: [
              'All personnel trained in emergency procedures',
              'Training specific to glass installation emergencies',
              'Regular refresher training provided',
              'Training documentation maintained',
              'Emergency training needs enhancement',
              'Inadequate emergency response training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'eap-13',
            question: 'Emergency Drill Program',
            options: [
              'Regular emergency drills conducted',
              'Drills include realistic scenarios',
              'Drill performance evaluated',
              'Drill results used to improve procedures',
              'Drill program needs improvement',
              'No emergency drill program'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      }
    ]
  },
  'scaffold-safety': {
    title: 'Scaffold Safety for Glass Installation',
    description: 'Scaffold safety assessment for glass installation operations',
    aiContext: 'Scaffolding for glass installation requires special considerations for load capacity, stability, and access. Glass panels create unique loading conditions and require specialized scaffold configurations.',
    sections: [
      {
        title: 'Scaffold Design and Engineering',
        description: 'Engineering and design requirements for glass installation scaffolds',
        items: [
          {
            id: 'ss-1',
            question: 'Scaffold Load Calculations',
            options: [
              'Load calculations include glass panel weights',
              'Dynamic loading factors considered',
              'Wind loading on glass panels calculated',
              'Safety factors appropriate for glass work',
              'Load calculations need review',
              'Inadequate load calculations'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'structural_integrity',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-2',
            question: 'Scaffold Configuration for Glass Work',
            options: [
              'Platform width adequate for glass handling',
              'Glass storage areas properly supported',
              'Access points suitable for glass transport',
              'Protection from glass panel swing',
              'Configuration needs improvement',
              'Scaffold inappropriate for glass work'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'structural_integrity',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-3',
            question: 'Foundation and Base Support',
            options: [
              'Foundation adequate for loads',
              'Base plates properly sized and placed',
              'Mudsills used where required',
              'Foundation stability verified',
              'Foundation needs improvement',
              'Inadequate foundation support'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'structural_integrity',
            complianceStandard: 'OSHA 1926.451'
          }
        ]
      },
      {
        title: 'Scaffold Inspection and Maintenance',
        description: 'Inspection and maintenance of scaffolds for glass installation',
        items: [
          {
            id: 'ss-4',
            question: 'Daily Scaffold Inspections',
            options: [
              'Daily inspections by competent person',
              'Inspection checklist comprehensive',
              'Deficiencies corrected promptly',
              'Inspection records maintained',
              'Inspection program needs improvement',
              'Inadequate scaffold inspections'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 9,
            riskCategory: 'inspection_maintenance',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-5',
            question: 'Weather-Related Inspections',
            options: [
              'Post-storm inspections conducted',
              'Wind damage assessment procedures',
              'Ice and snow load evaluations',
              'Weather-related modifications made',
              'Weather inspection procedures need improvement',
              'Inadequate weather-related inspections'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'inspection_maintenance',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-6',
            question: 'Scaffold Component Condition',
            options: [
              'All components in good condition',
              'Damaged components removed from service',
              'Proper component storage and handling',
              'Component inspection before assembly',
              'Component condition needs attention',
              'Damaged components in use'
            ],
            notes: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'inspection_maintenance',
            complianceStandard: 'OSHA 1926.451'
          }
        ]
      },
      {
        title: 'Fall Protection on Scaffolds',
        description: 'Fall protection systems for scaffold users',
        items: [
          {
            id: 'ss-7',
            question: 'Guardrail Systems',
            options: [
              'Guardrails on all open sides above 10 feet',
              'Top rails at 42 inches (±3 inches)',
              'Midrails at 21 inches',
              'Guardrails withstand required forces',
              'Guardrail system needs improvement',
              'Inadequate guardrail protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-8',
            question: 'Personal Fall Arrest Systems',
            options: [
              'PFAS available when guardrails inadequate',
              'Anchor points properly designed',
              'Fall arrest equipment inspected',
              'Workers trained in PFAS use',
              'PFAS program needs improvement',
              'Inadequate personal fall arrest'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-9',
            question: 'Platform and Planking Safety',
            options: [
              'Platforms fully planked',
              'No gaps greater than 1 inch',
              'Planks properly secured',
              'Platform capacity adequate',
              'Platform safety needs improvement',
              'Inadequate platform protection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.451'
          }
        ]
      },
      {
        title: 'Access and Egress',
        description: 'Safe access and egress from scaffolds',
        items: [
          {
            id: 'ss-10',
            question: 'Scaffold Access Systems',
            options: [
              'Proper access ladders or stairs provided',
              'Access points properly secured',
              'Access suitable for glass transport',
              'Emergency egress routes available',
              'Access systems need improvement',
              'Inadequate scaffold access'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'access_egress',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-11',
            question: 'Material Hoisting and Transport',
            options: [
              'Material hoisting systems adequate',
              'Glass transport methods safe',
              'Hoisting equipment properly rated',
              'Material handling procedures established',
              'Material transport needs improvement',
              'Inadequate material hoisting'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'access_egress',
            complianceStandard: 'OSHA 1926.451'
          }
        ]
      },
      {
        title: 'Training and Competency',
        description: 'Training requirements for scaffold users and erectors',
        items: [
          {
            id: 'ss-12',
            question: 'Scaffold User Training',
            options: [
              'All users trained in scaffold safety',
              'Training specific to glass installation',
              'Fall protection training included',
              'Training documentation current',
              'User training needs improvement',
              'Inadequate scaffold user training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.451'
          },
          {
            id: 'ss-13',
            question: 'Competent Person Designation',
            options: [
              'Competent person designated for inspections',
              'Competent person training current',
              'Authority to modify or stop work',
              'Competent person available on site',
              'Competent person program needs improvement',
              'No competent person designated'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.451'
          }
        ]
      }
    ]
  },
  'ladder-safety': {
    title: 'Ladder Safety for Glass Installation',
    description: 'Ladder safety assessment for glass installation operations',
    aiContext: 'Ladder use in glass installation requires special considerations due to the weight and size of glass panels, the need for both hands free for glass handling, and the potential for ladder instability when working with large materials.',
    sections: [
      {
        title: 'Ladder Selection and Suitability',
        description: 'Proper ladder selection for glass installation work',
        items: [
          {
            id: 'ls-1',
            question: 'Ladder Type and Rating',
            options: [
              'Ladders rated for glass installation loads',
              'Type I (Heavy Duty) or Type IA ladders used',
              'Ladder height appropriate for task',
              'Non-conductive ladders near electrical hazards',
              'Ladder selection needs improvement',
              'Inappropriate ladder selection'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'equipment_selection',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-2',
            question: 'Ladder Condition Assessment',
            options: [
              'Ladders free from structural defects',
              'Rungs and steps in good condition',
              'Hardware and fittings secure',
              'Ladder inspection current',
              'Ladder condition needs attention',
              'Ladders with known defects in use'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'equipment_condition',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-3',
            question: 'Ladder Appropriateness for Glass Work',
            options: [
              'Ladders suitable for glass handling tasks',
              'Platform ladders used when both hands needed',
              'Step ladders appropriate for task',
              'Extension ladders properly configured',
              'Ladder use inappropriate for glass work',
              'Ladders create additional hazards'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'equipment_selection',
            complianceStandard: 'OSHA 1926.1053'
          }
        ]
      },
      {
        title: 'Ladder Setup and Positioning',
        description: 'Proper ladder setup and positioning procedures',
        items: [
          {
            id: 'ls-4',
            question: 'Ladder Angle and Positioning',
            options: [
              'Extension ladders at proper 4:1 ratio',
              'Ladder base distance correct',
              'Ladder extends 3 feet above landing',
              'Ladder positioned on firm, level surface',
              'Ladder positioning needs correction',
              'Improper ladder positioning'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'setup_positioning',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-5',
            question: 'Ladder Stability and Security',
            options: [
              'Ladder properly secured at top',
              'Base secured to prevent displacement',
              'Ladder stable during use',
              'No movement or shifting during use',
              'Ladder stability needs improvement',
              'Ladder unstable or unsecured'
            ],
            notes: true,
            critical: true,
            images: true,
            aiWeight: 9,
            riskCategory: 'setup_positioning',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-6',
            question: 'Environmental Considerations',
            options: [
              'Wind conditions suitable for ladder use',
              'Surface conditions appropriate',
              'No overhead hazards present',
              'Adequate lighting for safe use',
              'Environmental conditions need attention',
              'Environmental conditions unsafe for ladder use'
            ],
            notes: true,
            critical: true,
            aiWeight: 7,
            riskCategory: 'environmental_factors',
            complianceStandard: 'OSHA 1926.1053'
          }
        ]
      },
      {
        title: 'Safe Ladder Use Practices',
        description: 'Safe practices for ladder use in glass installation',
        items: [
          {
            id: 'ls-7',
            question: 'Three-Point Contact Rule',
            options: [
              'Three-point contact maintained',
              'Workers trained in proper climbing',
              'No carrying materials while climbing',
              'Proper hand placement techniques',
              'Climbing practices need improvement',
              'Unsafe climbing practices observed'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'safe_use_practices',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-8',
            question: 'Load Limits and Capacity',
            options: [
              'Load limits not exceeded',
              'Glass weight considered in load calculations',
              'Only one person per ladder',
              'Tool and material weight included',
              'Load management needs attention',
              'Load limits regularly exceeded'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'safe_use_practices',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-9',
            question: 'Glass Handling from Ladders',
            options: [
              'Glass handling minimized on ladders',
              'Alternative methods used when possible',
              'Proper lifting techniques employed',
              'Assistance provided for glass handling',
              'Glass handling practices need improvement',
              'Unsafe glass handling from ladders'
            ],
            notes: true,
            critical: true,
            aiWeight: 9,
            riskCategory: 'safe_use_practices',
            complianceStandard: 'OSHA 1926.1053'
          }
        ]
      },
      {
        title: 'Inspection and Maintenance',
        description: 'Ladder inspection and maintenance programs',
        items: [
          {
            id: 'ls-10',
            question: 'Pre-Use Inspection Procedures',
            options: [
              'Ladders inspected before each use',
              'Inspection checklist comprehensive',
              'Defects identified and addressed',
              'Inspection training provided',
              'Inspection procedures need improvement',
              'No pre-use inspection program'
            ],
            notes: true,
            critical: true,
            aiWeight: 8,
            riskCategory: 'inspection_maintenance',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-11',
            question: 'Maintenance and Repair Program',
            options: [
              'Regular maintenance schedule followed',
              'Repairs performed by qualified personnel',
              'Damaged ladders removed from service',
              'Maintenance records maintained',
              'Maintenance program needs improvement',
              'No ladder maintenance program'
            ],
            notes: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'inspection_maintenance',
            complianceStandard: 'OSHA 1926.1053'
          }
        ]
      },
      {
        title: 'Training and Competency',
        description: 'Training requirements for ladder users',
        items: [
          {
            id: 'ls-12',
            question: 'Ladder Safety Training Program',
            options: [
              'Comprehensive ladder safety training',
              'Training specific to glass installation',
              'Proper setup and use techniques covered',
              'Training documentation maintained',
              'Training program needs enhancement',
              'Inadequate ladder safety training'
            ],
            notes: true,
            critical: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.1053'
          },
          {
            id: 'ls-13',
            question: 'Competency Verification',
            options: [
              'Worker competency verified',
              'Practical skills assessment conducted',
              'Refresher training provided',
              'Competency records maintained',
              'Competency verification needs improvement',
              'No competency verification program'
            ],
            notes: true,
            deadline: true,
            aiWeight: 7,
            riskCategory: 'training',
            complianceStandard: 'OSHA 1926.1053'
          }
        ]
      }
    ]
  },
  'jha': {
    title: 'Job Hazard Analysis (JHA)',
    description: 'Professional Job Hazard Analysis with comprehensive risk assessment and regulatory compliance',
    aiContext: 'Enterprise-grade Job Hazard Analysis using real OSHA data and AI-driven risk assessment. Focuses on fall protection, electrical hazards, and excavation safety with regulatory compliance verification.',
    sections: [
      {
        title: 'Fall Protection - Elevated Work',
        description: 'Critical fall protection assessment for work at height',
        items: [
          {
            id: 'fall_protection_work_height',
            question: 'Work Height (feet)',
            options: [], // Text input
            inputType: 'number',
            placeholder: 'Enter work height in feet',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.501'
          },
          {
            id: 'fall_protection_surface_conditions',
            question: 'Surface Conditions and Stability',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'Describe walking surface stability, material, weather exposure, slip hazards...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fall_protection_equipment',
            question: 'Fall Protection Equipment Present',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'List scaffolding, ladders, lifts, harnesses, guardrails, safety nets...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'fall_protection',
            complianceStandard: 'OSHA 1926.502'
          },
          {
            id: 'fall_protection_weather',
            question: 'Weather Conditions',
            options: [], // Text input
            inputType: 'text',
            placeholder: 'Wind speed, precipitation, temperature, visibility...',
            required: true,
            critical: true,
            images: true,
            aiWeight: 8,
            riskCategory: 'weather_hazards',
            complianceStandard: 'OSHA 1926.95'
          }
        ]
      },
      {
        title: 'Electrical Hazards - Power Tools & Systems',
        description: 'Electrical safety assessment for construction operations',
        items: [
          {
            id: 'electrical_power_source',
            question: 'Power Source Details',
            options: [], // Text input
            inputType: 'text',
            placeholder: 'Voltage, amperage, power supply type...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.95'
          },
          {
            id: 'electrical_moisture',
            question: 'Moisture and Wet Conditions Assessment',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'Describe any wet conditions, humidity, water sources, drainage issues...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.416'
          },
          {
            id: 'electrical_gfci',
            question: 'GFCI Protection Status',
            options: [
              'Yes - GFCI protected circuits',
              'Yes - Portable GFCI devices',
              'No - No GFCI protection',
              'Unknown - Protection status unclear',
              'Temporary power without GFCI'
            ],
            inputType: 'select',
            required: true,
            critical: true,
            images: true,
            aiWeight: 10,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.416'
          },
          {
            id: 'electrical_tool_condition',
            question: 'Electrical Tool and Cord Condition',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'Describe cord integrity, housing damage, recent inspection dates, defects...',
            required: true,
            critical: true,
            images: true,
            files: true,
            deadline: true,
            aiWeight: 8,
            riskCategory: 'electrical_hazards',
            complianceStandard: 'OSHA 1926.417'
          }
        ]
      },
      {
        title: 'Excavation & Trench Safety',
        description: 'Comprehensive excavation and trench safety evaluation',
        items: [
          {
            id: 'excavation_soil_type',
            question: 'Soil Classification and Type',
            options: [
              'Type A - Cohesive soil (clay, silty clay)',
              'Type B - Cohesive soil with moderate stability',
              'Type C - Granular soil (sand, gravel)',
              'Rock - Solid rock formation',
              'Unknown - Soil type not determined',
              'Mixed soil conditions'
            ],
            inputType: 'select',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'excavation_safety',
            complianceStandard: 'OSHA 1926.650'
          },
          {
            id: 'excavation_depth',
            question: 'Excavation Depth (feet)',
            options: [], // Number input
            inputType: 'number',
            placeholder: 'Enter excavation depth in feet',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 10,
            riskCategory: 'excavation_safety',
            complianceStandard: 'OSHA 1926.651'
          },
          {
            id: 'excavation_water',
            question: 'Water Conditions and Drainage',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'Describe groundwater, surface water, drainage systems, pumping requirements...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 8,
            riskCategory: 'excavation_safety',
            complianceStandard: 'OSHA 1926.651'
          },
          {
            id: 'excavation_adjacent_loads',
            question: 'Adjacent Loads and Structures',
            options: [], // Text area
            inputType: 'textarea',
            placeholder: 'Describe nearby equipment, materials, structures, traffic, utilities...',
            required: true,
            critical: true,
            images: true,
            files: true,
            aiWeight: 9,
            riskCategory: 'excavation_safety',
            complianceStandard: 'OSHA 1926.651'
          }
        ]
      }
    ]
  }
};