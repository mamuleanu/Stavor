package cs.si.satatt;

import settings.SettingsBasicFragment;
import settings.SettingsExtraFragment;
import settings.SettingsGeneralFragment;
import settings.SettingsModelsFragment;
import simulator.Simulator;
import fragments.NavigationDrawerFragment;
import fragments.HudFragment;
import fragments.SimulatorFragment;
import fragments.TestFragment;
import android.support.v7.app.ActionBarActivity;
import android.support.v7.app.ActionBar;
import android.app.FragmentManager;
import android.content.res.Configuration;
import android.support.v4.widget.DrawerLayout;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.Window;
import android.widget.Toast;
import app.Installer;

public class MainActivity extends ActionBarActivity implements
		NavigationDrawerFragment.NavigationDrawerCallbacks {

	/**
	 * Fragment managing the behaviors, interactions and presentation of the
	 * navigation drawer.
	 */
	private NavigationDrawerFragment mNavigationDrawerFragment;

	/**
	 * Used to store the last screen title. For use in
	 * {@link #restoreActionBar()}.
	 */
	private CharSequence mTitle;
	
	private Simulator simulator;
	public Simulator getSimulator(){
		return simulator;
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		Installer.installApkData(this);
		
		simulator = new Simulator(this);
		MainActivity prevActivity = (MainActivity)getLastCustomNonConfigurationInstance();
	   if(prevActivity!= null) { 
	       // So the orientation did change
	       // Restore some field for example
	       this.simulator = prevActivity.simulator;
	       //this.mNavigationDrawerFragment = prevActivity.mNavigationDrawerFragment;
	       //this.mTitle = prevActivity.mTitle;
	       Log.d("APP","Activity restarted: simulator recreated");
	   }
	    
		requestWindowFeature(Window.FEATURE_PROGRESS);
		setContentView(R.layout.activity_main);
		setProgressBarVisibility(true);
		
		mNavigationDrawerFragment = (NavigationDrawerFragment) getSupportFragmentManager()
				.findFragmentById(R.id.navigation_drawer);
		mTitle = getTitle();

		// Set up the drawer.
		mNavigationDrawerFragment.setUp(R.id.navigation_drawer,
				(DrawerLayout) findViewById(R.id.drawer_layout));
		
	}

	@Override
	public void onNavigationDrawerItemSelected(int position) {

		// update the main content by replacing fragments
		FragmentManager fragmentManager = getFragmentManager();
		if(position==0){// selection of tabs content
			fragmentManager
			.beginTransaction()
			.replace(R.id.container,
					SimulatorFragment.newInstance(position + 1)).commit();
		}else if(position==1){
			/*fragmentManager
			.beginTransaction()
			.replace(R.id.container,
					PlaceholderFragment.newInstance(position + 1)).commit();*/
			fragmentManager
			.beginTransaction()
			.replace(R.id.container,
					HudFragment.newInstance(position + 1)).commit();
		}else if(position==2){
			// Display the fragment as the main content.
	        fragmentManager
	        .beginTransaction()
	        .replace(R.id.container, new SettingsBasicFragment()).commit();
		}else if(position==3){
			// Display the fragment as the main content.
	        fragmentManager
	        .beginTransaction()
	        .replace(R.id.container, new SettingsExtraFragment()).commit();
		}else if(position==4){
			// Display the fragment as the main content.
	        fragmentManager
	        .beginTransaction()
	        .replace(R.id.container, new SettingsModelsFragment()).commit();
		}else if(position==5){
			// Display the fragment as the main content.
	        fragmentManager
	        .beginTransaction()
	        .replace(R.id.container, new SettingsGeneralFragment()).commit();
		}else if(position==6){
			// Display the fragment as the main content.
	        fragmentManager
	        .beginTransaction()
	        .replace(R.id.container, TestFragment.newInstance(position + 1)).commit();
		}else{
			
		}
	}

	public void onSectionAttached(int number) {
		switch (number) {
		case 1:
			mTitle = getString(R.string.title_section1);
			break;
		case 2:
			mTitle = getString(R.string.title_section2);
			break;
		case 3:
			mTitle = getString(R.string.title_section3);
			break;
		case 4:
			mTitle = getString(R.string.title_section4);
			break;
		case 5:
			mTitle = getString(R.string.title_section5);
			break;
		case 6:
			mTitle = getString(R.string.title_section6);
			break;
		case 7:
			mTitle = getString(R.string.title_section7);
			break;
		}
	}

	public void restoreActionBar() {
		ActionBar actionBar = getSupportActionBar();
		actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
		actionBar.setDisplayShowTitleEnabled(true);
		actionBar.setTitle(mTitle);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		if (!mNavigationDrawerFragment.isDrawerOpen()) {
			// Only show items in the action bar relevant to this screen
			// if the drawer is not showing. Otherwise, let the drawer
			// decide what to show in the action bar.
			getMenuInflater().inflate(R.menu.main, menu);
			restoreActionBar();
			return true;
		}
		return super.onCreateOptionsMenu(menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();
		if (id == R.id.action_settings) {
			return true;
		}
		return super.onOptionsItemSelected(item);
	}

	public void showHud() {
		// TODO Auto-generated method stub
		runOnUiThread( new Runnable() {
			public void run() {
				mNavigationDrawerFragment.select(1);
				onSectionAttached(2);
				restoreActionBar();
	        }
		});
	}
	
	@Override
	public Object onRetainCustomNonConfigurationInstance() {
	    //restore all your data here
		return this;
	}

}
