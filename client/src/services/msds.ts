import { getChatResponse } from './gemini';
import { searchCompounds, PubChemCompound } from './pubchem';

export const enhanceCompoundData = async (compound: PubChemCompound): Promise<PubChemCompound> => {
  try {
    const prompt = `Provide additional safety information for the chemical compound ${compound.name} (${compound.formula}). Include:
    1. Hazards and risks
    2. First aid measures
    3. Safe handling procedures
    4. Storage requirements
    5. Disposal methods
    Format the response in clear, concise bullet points.`;

    const aiResponse = await getChatResponse(prompt);
    
    // Parse AI response and merge with PubChem data
    return {
      ...compound,
      hazards: [...new Set([...compound.hazards, ...extractSection(aiResponse, 'hazards')])],
      firstAid: [...new Set([...compound.firstAid, ...extractSection(aiResponse, 'first aid')])],
      handling: [...new Set([...compound.handling, ...extractSection(aiResponse, 'handling')])],
      storage: [...new Set([...compound.storage, ...extractSection(aiResponse, 'storage')])],
      disposal: [...new Set([...compound.disposal, ...extractSection(aiResponse, 'disposal')])]
    };
  } catch (error) {
    
    return compound;
  }
};

const extractSection = (text: string, section: string): string[] => {
  const lines = text.split('\n');
  const relevantLines = lines.filter(line => 
    line.toLowerCase().includes(section.toLowerCase()) &&
    (line.startsWith('-') || line.startsWith('•'))
  );
  return relevantLines.map(line => line.replace(/^[-•]\s*/, '').trim());
};