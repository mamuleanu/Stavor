package cs.si.stavor.model;

import java.util.ArrayList;

import org.orekit.bodies.CelestialBodyFactory;
import org.orekit.bodies.GeodeticPoint;
import org.orekit.bodies.OneAxisEllipsoid;
import org.orekit.errors.OrekitException;
import org.orekit.frames.Frame;
import org.orekit.propagation.SpacecraftState;
import org.orekit.utils.Constants;

import android.view.View;
import android.webkit.WebView;

import com.google.gson.Gson;

import cs.si.satcor.MainActivity;
import cs.si.satcor.StavorApplication;
import cs.si.stavor.app.Parameters;

/**
 * Contains and handles both the model information and configuration
 * @author Xavier Gibert
 *
 */
public class ModelSimulation {
	private Gson gson = new Gson();
    private ModelConfigurationMap config;
    private MainActivity activity;
    private WebView browser;
    private boolean isBrowserLoaded;
    private Browsers selectedBrowser = Browsers.None;
    
    public ModelSimulation(MainActivity acv){
    	isBrowserLoaded = false;
    	activity=acv;
    	config = new ModelConfigurationMap(activity.getApplicationContext(),
    			getMapPathBuffer(),
    			((StavorApplication)activity.getApplication()).follow_sc);
    }
    
    /**
     * Initialize the required elements for the simulation, 
     * before the simulator is played to save time
     */
    public void preInitialize(){
    	try{
	    	if(earthFixedFrame==null){
				earthFixedFrame = CelestialBodyFactory.getEarth().getBodyOrientedFrame();
	    	}
			if(earth==null && earthFixedFrame!=null){
				earth = new OneAxisEllipsoid(
	    				Constants.WGS84_EARTH_EQUATORIAL_RADIUS,
	    		 		Constants.WGS84_EARTH_FLATTENING,
	    		 		earthFixedFrame);
			}
    	} catch (OrekitException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
    
    /**
     * Establish the Hud View
     * @param hud
     * @param mBrowser
     */
    public void setHud(Browsers type, View mBrowser){
    	selectedBrowser = type;
    	if(selectedBrowser.equals(Browsers.Map)){
        	browser = (WebView)mBrowser;
    	}
    }
    
    public void clearHud(){
      	selectedBrowser = Browsers.None;
    	browser = null;
    }
    
    /**
     * Set the loaded status of the browser
     * @param is
     */
    public void setBrowserloaded(boolean is) {
    	isBrowserLoaded = is;
	}

    /**
     * Returns the Initialization for the WebGL model in a JavaScript readable format
     * @return
     */
	public synchronized String getInitializationMapJSON() {
    	config = new ModelConfigurationMap(activity.getApplicationContext(),
    			getMapPathBuffer(),
    			((StavorApplication)activity.getApplication()).follow_sc);
        return gson.toJson(config);
    }
    
    /**
     * Pushes the new simulation step to the WebGL model
     */
    public void pushSimulationModel(){
    	if(browser!=null && isBrowserLoaded){
    		if(selectedBrowser.equals(Browsers.Map)){
    			if(mapPathBuffer.size()!=0){
    				browser.loadUrl("javascript:updateModelState('"+gson.toJson(getMapPathBufferLast())+"')");
    			}
    		}
    	}
	}
    
    private void clearSimulationModel(){
    	if(browser!=null && isBrowserLoaded){
    		if(selectedBrowser.equals(Browsers.Map)){
				browser.loadUrl("javascript:clearPath()");
    		}
    	}
	}
    
    private OneAxisEllipsoid earth;
    private Frame earthFixedFrame;
    public void updateSimulation(SpacecraftState scs, int sim_progress){
    	if(selectedBrowser.equals(Browsers.Map)){
    		 try {
    		 	GeodeticPoint gp = earth.transform(scs.getPVCoordinates().getPosition(), scs.getFrame(), scs.getDate());
    		 	double lat = gp.getLatitude()*180/Math.PI;
    		 	double lon = gp.getLongitude()*180/Math.PI;
    		 	double alt = gp.getAltitude();
    		 	if(!Double.isNaN(lat)&&!Double.isNaN(lon))
    		 		addToMapPathBuffer(lat, lon, alt);
    		} catch (OrekitException e) {
    			e.printStackTrace();
    		}
    	}
    }


	private ArrayList<MapPoint> mapPathBuffer = new ArrayList<MapPoint>();
	public synchronized void resetMapPathBuffer() {
		mapPathBuffer.clear();
		clearSimulationModel();
	}
	
	private double tmp_lat=0, tmp_lon=0;
	public synchronized void addToMapPathBuffer(double lat, double lon, double alt) {
		if(Math.abs(tmp_lat-lat)>Parameters.Map.marker_pos_threshold || Math.abs(tmp_lon-lon)>Parameters.Map.marker_pos_threshold){
			tmp_lat = lat;
			tmp_lon = lon;
			mapPathBuffer.add(new MapPoint(lat,lon,alt));
		}
	}
	public synchronized MapPoint[] getMapPathBuffer(){
		MapPoint[] r =
				  (MapPoint[])mapPathBuffer.toArray(new MapPoint[mapPathBuffer.size()]);
		//resetMapPathBuffer();
		return r;
	}
	public synchronized MapPoint[] getMapPathBufferLast(){
		MapPoint[] r = {mapPathBuffer.get(mapPathBuffer.size()-1)};
		return r;
	}
	
	class MapPoint{
		public MapPoint(double lat, double lon, double alt){
			latitude = lat;
			longitude = lon;
			altitude = alt;
		}
		double latitude = 0;
		double longitude = 0;
		double altitude = 0;
	}

	
}
