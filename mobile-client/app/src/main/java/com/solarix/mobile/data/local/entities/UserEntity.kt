package com.solarix.mobile.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entity representing the local cached user session and profile.
 * NIC serves as the immutable primary key as mandated by course architecture.
 */
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val nic: String,
    val fullName: String,
    val email: String,
    val role: String,
    val status: String,
    val token: String,
    val phoneNumber: String? = null,
    val address: String? = null,
    val solarCapacityKW: Double = 0.0,
    val lastLoginAt: Long = System.currentTimeMillis()
)
