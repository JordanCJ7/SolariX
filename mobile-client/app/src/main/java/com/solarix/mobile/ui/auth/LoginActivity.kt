package com.solarix.mobile.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.solarix.mobile.data.remote.RetrofitClient
import com.solarix.mobile.data.repository.AuthRepository
import com.solarix.mobile.databinding.ActivityLoginBinding
import com.solarix.mobile.ui.operator.OperatorDashboardActivity
import com.solarix.mobile.ui.prosumer.ProsumerDashboardActivity
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        authRepository = AuthRepository(this)
        sessionManager = SessionManager.getInstance(this)

        // Check if existing session is already active
        if (sessionManager.isLoggedIn()) {
            routeUserByRole(sessionManager.getUserRole())
            return
        }

        binding.tvConfigureApi.text = "Server: ${RetrofitClient.getBaseUrl()} (Tap to change)"
        binding.tvConfigureApi.setOnClickListener {
            showConfigureServerDialog()
        }

        binding.btnLogin.setOnClickListener {
            val identifier = binding.etIdentifier.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (identifier.isBlank() || password.isBlank()) {
                Toast.makeText(this, "Please enter both credentials.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performLogin(identifier, password)
        }

        binding.tvRegisterLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun performLogin(identifier: String, pass: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnLogin.isEnabled = false

        lifecycleScope.launch {
            val result = authRepository.login(identifier, pass)
            binding.progressBar.visibility = View.GONE
            binding.btnLogin.isEnabled = true

            result.onSuccess { response ->
                Toast.makeText(this@LoginActivity, "Login successful: ${response.fullName}", Toast.LENGTH_SHORT).show()
                routeUserByRole(response.role)
            }.onFailure { error ->
                AlertDialog.Builder(this@LoginActivity)
                    .setTitle("Authentication Error")
                    .setMessage(error.message ?: "Invalid credentials. Please verify your NIC/Email and password.")
                    .setPositiveButton("OK", null)
                    .show()
            }
        }
    }

    private fun routeUserByRole(role: String?) {
        when (role?.lowercase()) {
            "prosumer" -> {
                val intent = Intent(this, ProsumerDashboardActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            "gridoperator", "operator" -> {
                val intent = Intent(this, OperatorDashboardActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
            "backoffice" -> {
                AlertDialog.Builder(this)
                    .setTitle("Access Restricted")
                    .setMessage("Backoffice administrative accounts must access the system via the Web Portal.")
                    .setPositiveButton("OK", null)
                    .show()
            }
            else -> {
                // Default to prosumer portal
                val intent = Intent(this, ProsumerDashboardActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
        }
    }

    private fun showConfigureServerDialog() {
        val input = EditText(this).apply {
            setText(RetrofitClient.getBaseUrl())
        }
        AlertDialog.Builder(this)
            .setTitle("API Server Base URL")
            .setMessage("Configure backend endpoint (e.g. http://10.0.2.2:5000/api/ for emulator, or your machine's LAN IP):")
            .setView(input)
            .setPositiveButton("Save") { _, _ ->
                val newUrl = input.text.toString().trim()
                if (newUrl.isNotBlank()) {
                    RetrofitClient.setBaseUrl(newUrl)
                    binding.tvConfigureApi.text = "Server: ${RetrofitClient.getBaseUrl()} (Tap to change)"
                    authRepository = AuthRepository(this)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
