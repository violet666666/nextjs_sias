import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export const useRealTimeTasks = (classId = null) => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    if (!user || !token) return;

    const newSocket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"]
    });

    // Join user room
    newSocket.emit("join_user", { userId: user.id || user._id });

    // Join task room if classId is provided
    if (classId) {
      newSocket.emit("join_task_room", { classId });
    }

    // Listen for task updates
    newSocket.on("task_list_update", (updatedTasks) => {
      setTasks(updatedTasks);
    });

    // Listen for new task notifications
    newSocket.on("new_task_notification", (newTask) => {
      setTasks(prev => [newTask, ...prev]);
    });

    // Listen for new submissions
    newSocket.on("new_submission", (submission) => {
      setSubmissions(prev => [submission, ...prev]);
    });

    // Listen for grade updates
    newSocket.on("grade_update", (updatedSubmission) => {
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === updatedSubmission._id ? updatedSubmission : sub
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [classId]);

  // Fetch initial tasks
  const fetchTasks = useCallback(async () => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/tugas?kelas_id=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!classId) return;
    
    try {
      const res = await fetchWithAuth(`/api/submissions?kelas_id=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  }, [classId]);

  // Create new task (for teachers)
  const createTask = useCallback(async (taskData) => {
    if (!socket || !classId) return;
    
    try {
      // Optimistic update
      const optimisticTask = {
        _id: Date.now().toString(),
        ...taskData,
        kelas_id: classId,
        createdAt: new Date(),
        isOptimistic: true
      };
      setTasks(prev => [optimisticTask, ...prev]);

      // Send to server via socket
      socket.emit("new_task_created", { classId, taskData });

      // Also send via API for persistence
      const res = await fetchWithAuth("/api/tugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, kelas_id: classId })
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      // Remove optimistic task and let socket update with real data
      setTasks(prev => prev.filter(t => !t.isOptimistic));

      return true;
    } catch (err) {
      // Remove optimistic task on error
      setTasks(prev => prev.filter(t => !t.isOptimistic));
      setError(err.message);
      return false;
    }
  }, [socket, classId]);

  // Submit task (for students)
  const submitTask = useCallback(async (taskId, submissionData) => {
    if (!socket) return;
    
    try {
      // Optimistic update
      const optimisticSubmission = {
        _id: Date.now().toString(),
        tugas_id: taskId,
        ...submissionData,
        createdAt: new Date(),
        isOptimistic: true
      };
      setSubmissions(prev => [optimisticSubmission, ...prev]);

      // Send to server via socket
      socket.emit("task_submitted", { taskId, submissionData });

      // Also send via API for persistence
      const res = await fetchWithAuth("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tugas_id: taskId, ...submissionData })
      });

      if (!res.ok) {
        throw new Error('Failed to submit task');
      }

      // Remove optimistic submission and let socket update with real data
      setSubmissions(prev => prev.filter(s => !s.isOptimistic));

      return true;
    } catch (err) {
      // Remove optimistic submission on error
      setSubmissions(prev => prev.filter(s => !s.isOptimistic));
      setError(err.message);
      return false;
    }
  }, [socket]);

  // Update grade (for teachers)
  const updateGrade = useCallback(async (submissionId, gradeData) => {
    if (!socket) return;
    
    try {
      // Optimistic update
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === submissionId 
            ? { ...sub, nilai: gradeData.nilai, feedback: gradeData.feedback, isOptimistic: true }
            : sub
        )
      );

      // Send to server via socket
      socket.emit("grade_updated", { submissionId, gradeData });

      // Also send via API for persistence
      const res = await fetchWithAuth(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeData)
      });

      if (!res.ok) {
        throw new Error('Failed to update grade');
      }

      // Remove optimistic flag and let socket update with real data
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === submissionId 
            ? { ...sub, isOptimistic: false }
            : sub
        )
      );

      return true;
    } catch (err) {
      // Revert optimistic update on error
      setSubmissions(prev => 
        prev.map(sub => 
          sub._id === submissionId 
            ? { ...sub, nilai: sub.nilai, feedback: sub.feedback, isOptimistic: false }
            : sub
        )
      );
      setError(err.message);
      return false;
    }
  }, [socket]);

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, [fetchTasks, fetchSubmissions]);

  return {
    tasks,
    submissions,
    loading,
    error,
    createTask,
    submitTask,
    updateGrade,
    refetchTasks: fetchTasks,
    refetchSubmissions: fetchSubmissions
  };
}; 