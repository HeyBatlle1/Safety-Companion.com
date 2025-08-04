import axios from 'axios';

const BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export interface PubChemCompound {
  name: string;
  formula: string;
  hazards: string[];
  firstAid: string[];
  handling: string[];
  storage: string[];
  disposal: string[];
}

export const searchCompounds = async (query: string): Promise<PubChemCompound[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await axios.get(`${BASE_URL}/compound/name/${encodeURIComponent(query)}/JSON`);
    if (!response.data?.PC_Compounds?.length) return [];
    
    const compounds: PubChemCompound[] = [];
    for (const compound of response.data.PC_Compounds) {
      try {
        const details = await fetchCompoundDetails(compound.id.id.cid);
        compounds.push(details);
      } catch (error) {
        
      }
    }
    return compounds;
  } catch (error) {
    
    return [];
  }
};

const fetchCompoundDetails = async (cid: number): Promise<PubChemCompound> => {
  try {
    const [propertiesRes, ghsRes] = await Promise.all([
      axios.get(`${BASE_URL}/compound/cid/${cid}/property/IUPACName,MolecularFormula/JSON`),
      axios.get(`${BASE_URL}/compound/cid/${cid}/xrefs/GHS/JSON`)
    ]);

    const properties = propertiesRes.data?.PropertyTable?.Properties?.[0] || {};
    const ghs = ghsRes.data?.InformationList?.Information?.[0] || {};

    return {
      name: properties.IUPACName || 'Unknown',
      formula: properties.MolecularFormula || 'Unknown',
      hazards: Array.isArray(ghs.hazard) ? ghs.hazard : [],
      firstAid: Array.isArray(ghs.firstAid) ? ghs.firstAid : [],
      handling: Array.isArray(ghs.handling) ? ghs.handling : [],
      storage: Array.isArray(ghs.storage) ? ghs.storage : [],
      disposal: Array.isArray(ghs.disposal) ? ghs.disposal : []
    };
  } catch (error) {
    
    return {
      name: 'Error fetching compound',
      formula: 'Unknown',
      hazards: [],
      firstAid: [],
      handling: [],
      storage: [],
      disposal: []
    };
  }
};