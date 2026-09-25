package com.solarix.mobile.ui.operator

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.CaptureManager
import com.solarix.mobile.databinding.ActivityQrScannerBinding

class QRScannerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityQrScannerBinding
    private var captureManager: CaptureManager? = null
    private var isTorchOn = false

    private val requestCameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                initializeScanner(null)
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR codes.", Toast.LENGTH_LONG).show()
                finish()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQrScannerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            initializeScanner(savedInstanceState)
        } else {
            requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        setupControls()
    }

    private fun initializeScanner(savedInstanceState: Bundle?) {
        captureManager = CaptureManager(this, binding.barcodeScannerView)
        captureManager?.initializeFromIntent(intent, savedInstanceState)
        captureManager?.decode()

        binding.barcodeScannerView.decodeSingle(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult?) {
                result?.text?.let { scannedText ->
                    handleScannedToken(scannedText)
                }
            }
        })
    }

    private fun setupControls() {
        binding.btnToggleTorch.setOnClickListener {
            if (isTorchOn) {
                binding.barcodeScannerView.setTorchOff()
                isTorchOn = false
                binding.btnToggleTorch.text = "Turn On Flashlight"
            } else {
                binding.barcodeScannerView.setTorchOn()
                isTorchOn = true
                binding.btnToggleTorch.text = "Turn Off Flashlight"
            }
        }

        binding.btnManualEntry.setOnClickListener {
            showManualTokenDialog()
        }
    }

    private fun showManualTokenDialog() {
        val input = EditText(this).apply {
            hint = "Paste or enter QR token string..."
        }

        AlertDialog.Builder(this)
            .setTitle("Manual Token Entry")
            .setMessage("For testing or camera fallbacks, you can paste the reservation QR token directly:")
            .setView(input)
            .setPositiveButton("Verify") { _, _ ->
                val token = input.text.toString().trim()
                if (token.isNotBlank()) {
                    handleScannedToken(token)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun handleScannedToken(qrToken: String) {
        val intent = Intent(this, JobCompletionActivity::class.java).apply {
            putExtra("SCANNED_QR_TOKEN", qrToken)
        }
        startActivity(intent)
        finish()
    }

    override fun onResume() {
        super.onResume()
        captureManager?.onResume()
    }

    override fun onPause() {
        super.onPause()
        captureManager?.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        captureManager?.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        captureManager?.onSaveInstanceState(outState)
    }
}
