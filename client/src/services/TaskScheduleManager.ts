import supabase from './supabase';

export interface Task {
  id: string;
  siteId: string;
  type: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string[];
  equipment?: string[];
  hazards?: string[];
  safetyRequirements?: string[];
}

export class TaskScheduleManager {
  constructor(private db = supabase) {}

  async getScheduledTasks(siteId: string, date: Date): Promise<Task[]> {
    try {
      const { data, error } = await this.db
        .from('tasks')
        .select('*')
        .eq('site_id', siteId)
        .gte('scheduled_start', date.toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      return data.map(this.mapTaskFromDB);
    } catch (error) {
      console.error('Error fetching scheduled tasks:', error);
      
      // Return mock data for development
      return this.getMockTasks(siteId, date);
    }
  }

  private mapTaskFromDB(dbTask: any): Task {
    return {
      id: dbTask.id,
      siteId: dbTask.site_id,
      type: dbTask.type,
      description: dbTask.description,
      scheduledStart: dbTask.scheduled_start,
      scheduledEnd: dbTask.scheduled_end,
      status: dbTask.status,
      assignedTo: dbTask.assigned_to,
      equipment: dbTask.equipment,
      hazards: dbTask.hazards,
      safetyRequirements: dbTask.safety_requirements
    };
  }

  private getMockTasks(siteId: string, date: Date): Task[] {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: '1',
        siteId,
        type: 'excavation',
        description: 'Foundation excavation for Building A',
        scheduledStart: date.toISOString(),
        scheduledEnd: tomorrow.toISOString(),
        status: 'in-progress',
        equipment: ['excavator', 'dump truck'],
        hazards: ['deep excavation', 'heavy machinery'],
        safetyRequirements: ['hard hat', 'high-vis vest', 'safety boots']
      },
      {
        id: '2',
        siteId,
        type: 'concrete_pour',
        description: 'Concrete foundation pour',
        scheduledStart: tomorrow.toISOString(),
        scheduledEnd: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        equipment: ['concrete mixer', 'pump truck'],
        hazards: ['chemical exposure', 'heavy machinery'],
        safetyRequirements: ['hard hat', 'safety glasses', 'chemical resistant gloves']
      }
    ];
  }
}