package com.solarix.mobile.ui.map

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.solarix.mobile.R
import com.solarix.mobile.data.remote.dtos.StationResponse
import com.solarix.mobile.data.repository.StationRepository
import com.solarix.mobile.databinding.ActivityStationsMapBinding
import com.solarix.mobile.ui.prosumer.CreateBookingActivity
import kotlinx.coroutines.launch

class StationsMapActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var binding: ActivityStationsMapBinding
    private lateinit var stationRepository: StationRepository
    private var googleMap: GoogleMap? = null

    private var stationsList: List<StationResponse> = emptyList()
    private val stationMarkerMap = HashMap<Marker, StationResponse>()
    private var selectedStation: StationResponse? = null

    private val requestLocationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
            val coarseLocationGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false

            if (fineLocationGranted || coarseLocationGranted) {
                enableUserLocation()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityStationsMapBinding.inflate(layoutInflater)
        setContentView(binding.root)

        stationRepository = StationRepository(this)

        val mapFragment = supportFragmentManager.findFragmentById(R.id.mapFragment) as? SupportMapFragment
        mapFragment?.getMapAsync(this)

        setupListeners()
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map

        map.uiSettings.isZoomControlsEnabled = true
        map.uiSettings.isCompassEnabled = true

        checkLocationPermissions()
        loadStationMarkers()

        map.setOnMarkerClickListener { marker ->
            val station = stationMarkerMap[marker]
            if (station != null) {
                showStationDetails(station)
            }
            false
        }

        map.setOnMapClickListener {
            hideStationDetails()
        }
    }

    private fun checkLocationPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED
        ) {
            enableUserLocation()
        } else {
            requestLocationPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    private fun enableUserLocation() {
        try {
            googleMap?.isMyLocationEnabled = true
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    private fun setupListeners() {
        binding.btnRefreshMap.setOnClickListener {
            loadStationMarkers()
        }

        binding.btnCloseDetails.setOnClickListener {
            hideStationDetails()
        }

        binding.btnBookAtStation.setOnClickListener {
            val station = selectedStation ?: return@setOnClickListener
            val intent = Intent(this, CreateBookingActivity::class.java).apply {
                putExtra("STATION_ID", station.id)
            }
            startActivity(intent)
        }
    }

    private fun loadStationMarkers() {
        binding.tvStationCount.text = "Loading microgrid nodes..."

        lifecycleScope.launch {
            val result = stationRepository.getStations(activeOnly = true)
            result.onSuccess { stations ->
                stationsList = stations
                binding.tvStationCount.text = "${stations.size} Active Hubs Located"
                renderMarkersOnMap(stations)
            }.onFailure { error ->
                binding.tvStationCount.text = "Failed to load hubs"
                Toast.makeText(this@StationsMapActivity, "Error: ${error.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun renderMarkersOnMap(stations: List<StationResponse>) {
        val map = googleMap ?: return
        map.clear()
        stationMarkerMap.clear()

        if (stations.isEmpty()) return

        val boundsBuilder = LatLngBounds.Builder()

        for (station in stations) {
            val latLng = LatLng(station.latitude, station.longitude)
            boundsBuilder.include(latLng)

            val markerHue = if (station.availableBatterySlots > 0) {
                BitmapDescriptorFactory.HUE_AZURE
            } else {
                BitmapDescriptorFactory.HUE_ORANGE
            }

            val markerOptions = MarkerOptions()
                .position(latLng)
                .title(station.stationName)
                .snippet("Slots: ${station.availableBatterySlots}/${station.totalBatterySlots} | ${station.capacityKWh} kWh")
                .icon(BitmapDescriptorFactory.defaultMarker(markerHue))

            val marker = map.addMarker(markerOptions)
            if (marker != null) {
                stationMarkerMap[marker] = station
            }
        }

        try {
            val bounds = boundsBuilder.build()
            map.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds, 120))
        } catch (e: Exception) {
            // If only 1 station or bounding failed, center on first
            val first = stations.first()
            map.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(first.latitude, first.longitude), 12f))
        }
    }

    private fun showStationDetails(station: StationResponse) {
        selectedStation = station
        binding.tvDetailStationName.text = "${station.stationName} (${station.stationCode})"
        binding.tvDetailLocation.text = station.locationName
        binding.tvDetailCapacity.text = "${station.capacityKWh} kWh"
        binding.tvDetailSlots.text = "${station.availableBatterySlots} / ${station.totalBatterySlots}"
        binding.tvDetailHours.text = station.operationalHours ?: "06:00 - 20:00"

        binding.cardStationDetails.visibility = View.VISIBLE
    }

    private fun hideStationDetails() {
        selectedStation = null
        binding.cardStationDetails.visibility = View.GONE
    }
}
