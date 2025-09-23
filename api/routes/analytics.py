"""
Analytics and Reporting Routes
Provides comprehensive analytics for the vehicle detection system including:
- Detection trends and patterns
- User engagement metrics
- System performance statistics
- Notification delivery rates
- Popular detection locations and times
"""

from fastapi import APIRouter, HTTPException, Query as QueryParam
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import calendar

from ..db.database import (
    detections_table, users_table, plates_table, notifications_table,
    Detection as DetectionQuery, User as UserQuery, Plate as PlateQuery
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=Dict[str, Any])
def get_dashboard_analytics():
    """
    Get comprehensive dashboard analytics including:
    - Key performance indicators (KPIs)
    - Recent activity trends
    - System health metrics
    - User engagement statistics
    """
    try:
        # Get all data
        all_detections = detections_table.all()
        all_users = users_table.all()
        all_plates = plates_table.all()
        all_notifications = notifications_table.all()
        
        # Calculate date ranges
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Helper function to parse dates safely
        def parse_date(date_str):
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                return None
        
        # Filter detections by time periods
        today_detections = [
            d for d in all_detections 
            if parse_date(d.get('detected_at', '')) and 
               parse_date(d.get('detected_at', '')) >= today
        ]
        
        week_detections = [
            d for d in all_detections 
            if parse_date(d.get('detected_at', '')) and 
               parse_date(d.get('detected_at', '')) >= week_ago
        ]
        
        month_detections = [
            d for d in all_detections 
            if parse_date(d.get('detected_at', '')) and 
               parse_date(d.get('detected_at', '')) >= month_ago
        ]
        
        # Calculate KPIs
        total_detections = len(all_detections)
        matched_detections = len([d for d in all_detections if d.get('matched_user_id')])
        successful_notifications = len([n for n in all_notifications if n.get('status') == 'sent'])
        
        # Calculate rates
        match_rate = (matched_detections / total_detections * 100) if total_detections > 0 else 0
        notification_rate = (successful_notifications / matched_detections * 100) if matched_detections > 0 else 0
        
        # User statistics
        active_users = len([u for u in all_users if u.get('is_active', True)])
        total_plates = len([p for p in all_plates if p.get('is_active', True)])
        
        # Recent activity trends
        activity_trends = {
            'today': len(today_detections),
            'this_week': len(week_detections),
            'this_month': len(month_detections),
            'yesterday': len([
                d for d in all_detections 
                if parse_date(d.get('detected_at', '')) and 
                   yesterday <= parse_date(d.get('detected_at', '')) < today
            ])
        }
        
        # Top performing metrics
        plate_counter = Counter([d.get('plate_number', 'UNKNOWN') for d in all_detections])
        location_counter = Counter([d.get('location', 'Unknown') for d in all_detections if d.get('location')])
        camera_counter = Counter([d.get('camera_id', 'default') for d in all_detections])
        
        # System health metrics
        avg_confidence = sum(d.get('confidence', 0) for d in all_detections) / len(all_detections) if all_detections else 0
        
        # Detection patterns by hour
        hourly_patterns = defaultdict(int)
        for detection in all_detections:
            detected_at = parse_date(detection.get('detected_at', ''))
            if detected_at:
                hourly_patterns[detected_at.hour] += 1
        
        return {
            "kpis": {
                "total_detections": total_detections,
                "matched_detections": matched_detections,
                "match_rate_percent": round(match_rate, 2),
                "notification_success_rate": round(notification_rate, 2),
                "active_users": active_users,
                "registered_plates": total_plates,
                "average_confidence": round(avg_confidence * 100, 2)
            },
            "activity_trends": activity_trends,
            "top_metrics": {
                "most_detected_plates": [
                    {"plate": plate, "count": count} 
                    for plate, count in plate_counter.most_common(5)
                ],
                "busiest_locations": [
                    {"location": location, "count": count} 
                    for location, count in location_counter.most_common(5)
                ],
                "active_cameras": [
                    {"camera_id": camera, "count": count} 
                    for camera, count in camera_counter.most_common(5)
                ]
            },
            "patterns": {
                "hourly_distribution": dict(hourly_patterns),
                "peak_hour": max(hourly_patterns.items(), key=lambda x: x[1])[0] if hourly_patterns else 0
            },
            "system_health": {
                "database_status": "operational",
                "total_records": len(all_detections) + len(all_users) + len(all_plates),
                "last_detection": max([
                    d.get('detected_at', '') for d in all_detections
                ], default="No detections yet")
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")


@router.get("/trends", response_model=Dict[str, Any])
def get_detection_trends(
    period: str = QueryParam("week", description="Time period: day, week, month, year"),
    metric: str = QueryParam("detections", description="Metric to analyze: detections, matches, notifications")
):
    """
    Get detection trends over specified time periods
    Supports granular analysis of system performance over time
    """
    try:
        all_detections = detections_table.all()
        all_notifications = notifications_table.all()
        
        # Define time periods
        now = datetime.utcnow()
        if period == "day":
            start_date = now - timedelta(hours=24)
            time_format = "%H:00"
            time_delta = timedelta(hours=1)
        elif period == "week":
            start_date = now - timedelta(days=7)
            time_format = "%Y-%m-%d"
            time_delta = timedelta(days=1)
        elif period == "month":
            start_date = now - timedelta(days=30)
            time_format = "%Y-%m-%d"
            time_delta = timedelta(days=1)
        elif period == "year":
            start_date = now - timedelta(days=365)
            time_format = "%Y-%m"
            time_delta = timedelta(days=30)
        else:
            raise HTTPException(status_code=400, detail="Invalid period. Use: day, week, month, year")
        
        # Helper function to parse dates
        def parse_date(date_str):
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                return None
        
        # Filter data by time period
        filtered_detections = [
            d for d in all_detections 
            if parse_date(d.get('detected_at', '')) and 
               parse_date(d.get('detected_at', '')) >= start_date
        ]
        
        # Group data by time intervals
        time_series = defaultdict(int)
        current_time = start_date
        
        while current_time <= now:
            time_key = current_time.strftime(time_format)
            time_series[time_key] = 0
            current_time += time_delta
        
        # Count occurrences based on metric
        for detection in filtered_detections:
            detected_at = parse_date(detection.get('detected_at', ''))
            if detected_at:
                time_key = detected_at.strftime(time_format)
                
                if metric == "detections":
                    time_series[time_key] += 1
                elif metric == "matches" and detection.get('matched_user_id'):
                    time_series[time_key] += 1
                elif metric == "notifications" and detection.get('notification_sent'):
                    time_series[time_key] += 1
        
        # Calculate statistics
        values = list(time_series.values())
        total = sum(values)
        average = total / len(values) if values else 0
        peak = max(values) if values else 0
        
        return {
            "period": period,
            "metric": metric,
            "time_series": dict(time_series),
            "statistics": {
                "total": total,
                "average": round(average, 2),
                "peak": peak,
                "data_points": len(time_series)
            },
            "metadata": {
                "start_date": start_date.isoformat(),
                "end_date": now.isoformat(),
                "time_format": time_format
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate trends: {str(e)}")


@router.get("/user-engagement", response_model=Dict[str, Any])
def get_user_engagement_analytics():
    """
    Analyze user engagement patterns including:
    - Most active users (by detection frequency)
    - User registration trends
    - Plate registration patterns
    - Notification response patterns
    """
    try:
        all_users = users_table.all()
        all_plates = plates_table.all()
        all_detections = detections_table.all()
        all_notifications = notifications_table.all()
        
        # Helper function to parse dates
        def parse_date(date_str):
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                return None
        
        # User activity analysis
        user_detection_count = defaultdict(int)
        user_notification_count = defaultdict(int)
        
        for detection in all_detections:
            user_id = detection.get('matched_user_id')
            if user_id:
                user_detection_count[user_id] += 1
        
        for notification in all_notifications:
            user_id = notification.get('user_id')
            if user_id:
                user_notification_count[user_id] += 1
        
        # Get user details for top active users
        top_active_users = []
        for user_id, detection_count in sorted(user_detection_count.items(), 
                                             key=lambda x: x[1], reverse=True)[:10]:
            user = users_table.get(UserQuery.id == user_id)
            if user:
                user_plates = plates_table.search(PlateQuery.user_id == user_id)
                top_active_users.append({
                    "user_id": user_id,
                    "name": user.get('name', 'Unknown'),
                    "phone": user.get('phone', 'Unknown'),
                    "detection_count": detection_count,
                    "notification_count": user_notification_count.get(user_id, 0),
                    "registered_plates": len(user_plates),
                    "created_at": user.get('created_at', '')
                })
        
        # Registration trends
        now = datetime.utcnow()
        registration_trends = defaultdict(int)
        
        for user in all_users:
            created_at = parse_date(user.get('created_at', ''))
            if created_at:
                month_key = created_at.strftime('%Y-%m')
                registration_trends[month_key] += 1
        
        # Plate registration patterns
        plates_per_user = defaultdict(int)
        for plate in all_plates:
            if plate.get('is_active', True):
                plates_per_user[plate.get('user_id')] += 1
        
        plate_distribution = Counter(plates_per_user.values())
        
        # Calculate engagement metrics
        total_users = len(all_users)
        active_users = len([u for u in all_users if u.get('is_active', True)])
        users_with_detections = len(user_detection_count)
        users_with_notifications = len(user_notification_count)
        
        engagement_rate = (users_with_detections / active_users * 100) if active_users > 0 else 0
        notification_engagement = (users_with_notifications / users_with_detections * 100) if users_with_detections > 0 else 0
        
        return {
            "overview": {
                "total_users": total_users,
                "active_users": active_users,
                "users_with_detections": users_with_detections,
                "engagement_rate_percent": round(engagement_rate, 2),
                "notification_engagement_percent": round(notification_engagement, 2)
            },
            "top_active_users": top_active_users,
            "registration_trends": dict(registration_trends),
            "plate_distribution": {
                "plates_per_user": dict(plate_distribution),
                "average_plates_per_user": round(
                    sum(plates_per_user.values()) / len(plates_per_user), 2
                ) if plates_per_user else 0,
                "max_plates_per_user": max(plates_per_user.values()) if plates_per_user else 0
            },
            "activity_patterns": {
                "most_active_user_id": max(user_detection_count.items(), key=lambda x: x[1])[0] if user_detection_count else None,
                "most_notifications_user_id": max(user_notification_count.items(), key=lambda x: x[1])[0] if user_notification_count else None,
                "total_user_detections": sum(user_detection_count.values()),
                "total_notifications_sent": sum(user_notification_count.values())
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate user engagement analytics: {str(e)}")


@router.get("/system-performance", response_model=Dict[str, Any])
def get_system_performance_analytics():
    """
    Analyze system performance metrics including:
    - Detection accuracy and confidence levels
    - Processing times and system efficiency
    - Error rates and failure patterns
    - API response times and throughput
    """
    try:
        all_detections = detections_table.all()
        all_notifications = notifications_table.all()
        
        # Confidence level analysis
        confidence_levels = [d.get('confidence', 0) for d in all_detections if d.get('confidence') is not None]
        
        if confidence_levels:
            avg_confidence = sum(confidence_levels) / len(confidence_levels)
            min_confidence = min(confidence_levels)
            max_confidence = max(confidence_levels)
            
            # Confidence distribution
            high_confidence = len([c for c in confidence_levels if c >= 0.8])
            medium_confidence = len([c for c in confidence_levels if 0.6 <= c < 0.8])
            low_confidence = len([c for c in confidence_levels if c < 0.6])
        else:
            avg_confidence = min_confidence = max_confidence = 0
            high_confidence = medium_confidence = low_confidence = 0
        
        # Detection success rates
        total_detections = len(all_detections)
        successful_detections = len([d for d in all_detections if d.get('plate_number') != 'UNKNOWN'])
        matched_detections = len([d for d in all_detections if d.get('matched_user_id')])
        
        success_rate = (successful_detections / total_detections * 100) if total_detections > 0 else 0
        match_rate = (matched_detections / successful_detections * 100) if successful_detections > 0 else 0
        
        # Notification performance
        total_notifications = len(all_notifications)
        successful_notifications = len([n for n in all_notifications if n.get('status') == 'sent'])
        failed_notifications = total_notifications - successful_notifications
        
        notification_success_rate = (successful_notifications / total_notifications * 100) if total_notifications > 0 else 0
        
        # Error analysis
        error_detections = len([d for d in all_detections if d.get('plate_number') == 'UNKNOWN'])
        error_rate = (error_detections / total_detections * 100) if total_detections > 0 else 0
        
        # Camera performance analysis
        camera_performance = defaultdict(lambda: {'detections': 0, 'successes': 0, 'matches': 0})
        
        for detection in all_detections:
            camera_id = detection.get('camera_id', 'default')
            camera_performance[camera_id]['detections'] += 1
            
            if detection.get('plate_number') != 'UNKNOWN':
                camera_performance[camera_id]['successes'] += 1
            
            if detection.get('matched_user_id'):
                camera_performance[camera_id]['matches'] += 1
        
        # Calculate camera success rates
        camera_stats = {}
        for camera_id, stats in camera_performance.items():
            total = stats['detections']
            camera_stats[camera_id] = {
                'total_detections': total,
                'successful_detections': stats['successes'],
                'matched_detections': stats['matches'],
                'success_rate': (stats['successes'] / total * 100) if total > 0 else 0,
                'match_rate': (stats['matches'] / stats['successes'] * 100) if stats['successes'] > 0 else 0
            }
        
        # System health indicators
        recent_detections = [
            d for d in all_detections 
            if d.get('detected_at') and 
               (datetime.utcnow() - datetime.fromisoformat(d.get('detected_at', '').replace('Z', '+00:00'))).days <= 1
        ]
        
        return {
            "detection_performance": {
                "total_detections": total_detections,
                "successful_detections": successful_detections,
                "success_rate_percent": round(success_rate, 2),
                "match_rate_percent": round(match_rate, 2),
                "error_rate_percent": round(error_rate, 2)
            },
            "confidence_analysis": {
                "average_confidence": round(avg_confidence * 100, 2),
                "min_confidence": round(min_confidence * 100, 2),
                "max_confidence": round(max_confidence * 100, 2),
                "distribution": {
                    "high_confidence_count": high_confidence,
                    "medium_confidence_count": medium_confidence,
                    "low_confidence_count": low_confidence,
                    "high_confidence_percent": round(high_confidence / len(confidence_levels) * 100, 2) if confidence_levels else 0
                }
            },
            "notification_performance": {
                "total_notifications": total_notifications,
                "successful_notifications": successful_notifications,
                "failed_notifications": failed_notifications,
                "success_rate_percent": round(notification_success_rate, 2)
            },
            "camera_performance": camera_stats,
            "system_health": {
                "status": "operational" if recent_detections else "idle",
                "recent_activity_24h": len(recent_detections),
                "total_cameras": len(camera_performance),
                "best_performing_camera": max(camera_stats.items(), key=lambda x: x[1]['success_rate'])[0] if camera_stats else None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate system performance analytics: {str(e)}")


@router.get("/export", response_model=Dict[str, Any])
def export_analytics_data(
    format: str = QueryParam("json", description="Export format: json, csv"),
    include_raw_data: bool = QueryParam(False, description="Include raw detection data")
):
    """
    Export analytics data in various formats for external analysis
    Supports JSON and CSV formats with optional raw data inclusion
    """
    try:
        # Get dashboard analytics
        dashboard_data = get_dashboard_analytics()
        
        # Get trends data
        trends_data = get_detection_trends(period="month", metric="detections")
        
        # Get user engagement data
        engagement_data = get_user_engagement_analytics()
        
        # Get system performance data
        performance_data = get_system_performance_analytics()
        
        export_data = {
            "export_metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "format": format,
                "includes_raw_data": include_raw_data
            },
            "dashboard": dashboard_data,
            "trends": trends_data,
            "user_engagement": engagement_data,
            "system_performance": performance_data
        }
        
        # Include raw data if requested
        if include_raw_data:
            export_data["raw_data"] = {
                "detections": detections_table.all(),
                "users": users_table.all(),
                "plates": plates_table.all(),
                "notifications": notifications_table.all()
            }
        
        if format == "json":
            return export_data
        elif format == "csv":
            # For CSV format, we'll return a structured response that can be converted to CSV
            # This is a simplified version - in production, you might want to use pandas or csv module
            return {
                "message": "CSV export format not fully implemented in this demo",
                "data": export_data,
                "note": "Use the JSON format and convert to CSV using external tools"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use: json, csv")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export analytics data: {str(e)}")