package cs.si.stavor.model;

import cs.si.stavor.R;
import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

/**
 * Initialization parameters of the WebGL model
 * @author Xavier Gibert
 *
 */
public class ModelConfigurationOrbit {
	
	public ModelConfigurationOrbit(Context ctx){
		SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(ctx);
		try{
			performance_level = Integer.parseInt(sharedPref.getString(ctx.getString(R.string.pref_key_detail_level), Integer.toString(performance_level)));
			fps_update_skips = Integer.parseInt(sharedPref.getString(ctx.getString(R.string.pref_key_fps_update_skips), Integer.toString(fps_update_skips)));


			ref_orbit_a = Float.parseFloat(sharedPref.getString(ctx.getString(R.string.pref_key_ref_orbit_a), Float.toString(ref_orbit_a)));
			ref_orbit_e = Float.parseFloat(sharedPref.getString(ctx.getString(R.string.pref_key_ref_orbit_e), Float.toString(ref_orbit_e)));
			ref_orbit_i = Float.parseFloat(sharedPref.getString(ctx.getString(R.string.pref_key_ref_orbit_i), Float.toString(ref_orbit_i)));
			ref_orbit_o = Float.parseFloat(sharedPref.getString(ctx.getString(R.string.pref_key_ref_orbit_o), Float.toString(ref_orbit_o)));
			ref_orbit_r = Float.parseFloat(sharedPref.getString(ctx.getString(R.string.pref_key_ref_orbit_r), Float.toString(ref_orbit_r)));
			
		}catch(NumberFormatException e){
			System.err.println("Error loading configuration parameter: "+e.getMessage());
		}
		show_fps = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_fps), show_fps);
		show_sky = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_sky), show_sky);
		
		
		show_axis = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_axis), show_axis);
		show_axis_labels = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_axis_labels), show_axis_labels);
		
		show_earth = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_earth_orbit), show_earth);
		show_earth_axis = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_earth_axis), show_earth_axis);
		show_earth_atmosphere = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_earth_atmosphere), show_earth_atmosphere);
		show_earth_clouds = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_earth_clouds), show_earth_clouds);
		
		show_xy_plane = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_xy_plane), show_xy_plane);
		color_xy_plane = sharedPref.getInt(ctx.getString(R.string.pref_key_color_xy_plane), color_xy_plane);
		
		
		
		
		show_spacecraft = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_spacecraft), show_spacecraft);
		spacecraft_color = sharedPref.getInt(ctx.getString(R.string.pref_key_spacecraft_color), spacecraft_color);
		show_projection = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_projection_line), show_projection);
		
		orbit_color = sharedPref.getInt(ctx.getString(R.string.pref_key_orbit_color), orbit_color);


		ref_orbit_color = sharedPref.getInt(ctx.getString(R.string.pref_key_ref_orbit_color), ref_orbit_color);
		show_ref_orbit = sharedPref.getBoolean(ctx.getString(R.string.pref_key_show_ref_orbit), show_ref_orbit);
		
		
		
		
	}
	
	//Performances
	public int performance_level = 3;//1(simple) to 9(detailed)
	public boolean show_fps = true;
	public int fps_update_skips = 20;
	//General
	public boolean show_sky = true;
	public boolean show_sphere = true;
	
	//Axis
	public boolean show_axis = true;
	public boolean show_axis_labels = true;
	
	public boolean show_earth = true;
	public boolean show_earth_axis = true;
	public boolean show_earth_atmosphere = true;
	public boolean show_earth_clouds = true;
	
	public boolean show_xy_plane = false;
	public int color_xy_plane = 0xff0094;
	
	public boolean show_spacecraft = true;
	public int spacecraft_color = 0xfff200;
	public boolean show_projection = true;
	
	public int orbit_color = 0x00ff00;


	public int ref_orbit_color = 0xff0000;
	public boolean show_ref_orbit = false;
	public float ref_orbit_a = 26900000;//m
	public float ref_orbit_e = 0.23f;//
	public float ref_orbit_i = 49.8f;//deg
	public float ref_orbit_o = 0.0f;//deg
	public float ref_orbit_r = 0.0f;//deg
	
	
	
	
}
