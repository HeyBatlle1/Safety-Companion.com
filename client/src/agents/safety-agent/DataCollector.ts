import { WeatherAPIClient } from '../../services/WeatherAPIClient';
import { GeoLocationService } from '../../services/GeoLocationService';
import { TaskScheduleManager } from '../../services/TaskScheduleManager';
import { SiteData } from '../../types/safety';
import supabase from '../../services/supabase';

export class DataCollector {
  private weatherAPI: WeatherAPIClient;
  private geoService: GeoLocationService;
  private taskManager: TaskScheduleManager;

  constructor() {
    this.weatherAPI = new WeatherAPIClient();
    this.geoService = new GeoLocationService();
    this.taskManager = new TaskScheduleManager(supabase);
  }

  async collectSiteData(siteId: string): Promise<SiteData> {
    try {
      const location = await this.geoService.getSiteInformation(siteId);
      
      const [weather, forecast, tasks, incidents] = await Promise.all([
        this.weatherAPI.getCurrentConditions(location.latitude, location.longitude),
        this.weatherAPI.getForecast(location.latitude, location.longitude),
        this.taskManager.getScheduledTasks(siteId, new Date()),
        this.getRelevantIncidents(siteId, location.type)
      ]);

      return {
        weather,
        forecast,
        location,
        tasks,
        recentIncidents: incidents
      };
    } catch (error) {

      throw new Error('Failed to collect site data');
    }
  }

  private async getRelevantIncidents(siteId: string, siteType: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('safety_reports')
        .select('*')
        .eq('site_type', siteType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {

      return [];
    }
  }
}