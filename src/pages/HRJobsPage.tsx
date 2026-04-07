import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Briefcase, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface JDListItem {
  jobID: number;
  title: string;
  company_name: string;
  experience_level: string;
  location: string;
  status: string;
  skills: string[];
  created_at: string;
}

export default function HRJobsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JDListItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    experience_level: "",
    location: "",
    description: "",
    skills: "",
    status: "active",
  });

  const { data: jobs, isLoading } = useQuery<JDListItem[]>({
    queryKey: ["hr-jobs"],
    queryFn: () => apiFetch("/api/v1/jd/mine"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/api/v1/jd", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-jobs"] });
      toast.success("Job created successfully!");
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create job"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/api/v1/jd/${data.id}`, { method: "PUT", body: JSON.stringify(data.payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-jobs"] });
      toast.success("Job updated successfully!");
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to update job"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => apiFetch(`/api/v1/jd/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-jobs"] });
      toast.success("Status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/v1/jd/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-jobs"] });
      toast.success("Job deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      skills: formData.skills.split(",").map((s) => s.trim()).filter((s) => s),
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.jobID, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openNewModal = () => {
    setEditingJob(null);
    setFormData({ title: "", company_name: "", experience_level: "", location: "", description: "", skills: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEditModal = async (job: JDListItem) => {
    try {
      const fullJob: any = await apiFetch(`/api/v1/jd/${job.jobID}`);
      setEditingJob(fullJob);
      setFormData({
        title: fullJob.title,
        company_name: fullJob.company_name,
        experience_level: fullJob.experience_level,
        location: fullJob.location,
        description: fullJob.description,
        skills: fullJob.skills.join(", "),
        status: fullJob.status,
      });
      setIsModalOpen(true);
    } catch {
      toast.error("Failed to fetch full job details");
    }
  };

  const filteredJobs = jobs?.filter((j) =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.skills.join(" ").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="hr" />
      <div className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold">Job Descriptions</h1>
              <p className="text-muted-foreground mt-1 text-sm">Manage job postings, applicants, and statuses.</p>
            </div>
            <Button onClick={openNewModal} className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90 glow-primary font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Post New Job
            </Button>
          </div>

          <div className="glass p-4 rounded-xl flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading jobs...</p>
            ) : filteredJobs?.length === 0 ? (
              <div className="glass p-12 rounded-xl text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No jobs found</h3>
                <p className="text-muted-foreground mt-1">Create your first job posting to get started.</p>
              </div>
            ) : (
              filteredJobs?.map((job) => (
                <motion.div key={job.jobID} layout className="glass p-5 rounded-xl border border-border/50 flex items-center justify-between hover:border-[#00e5ff]/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-orange-400/10 text-orange-400 border-orange-400/20"}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> {job.company_name}</span>
                      <span className="flex items-center gap-1.5">{job.experience_level || "Any Experience"}</span>
                      <span className="flex items-center gap-1.5">{job.location || "Remote"}</span>
                      <span className="flex items-center gap-1.5 text-[#00e5ff]">{job.skills.slice(0, 3).join(", ")}{job.skills.length > 3 ? "..." : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => statusMutation.mutate({ id: job.jobID, status: job.status === "active" ? "draft" : "active" })} className="h-8">
                      {job.status === "active" ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Eye className="w-3.5 h-3.5 mr-1.5" /> Publish</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(job)} className="h-8 text-blue-400 hover:text-blue-300">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(job.jobID) }} className="h-8 text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job Description" : "Post New Job"}</DialogTitle>
            <DialogDescription>Fill in the details for the job posting below.</DialogDescription>
          </DialogHeader>
          <form id="jd-form" onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Job Title</label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Company Name</label>
                <Input value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Experience Level</label>
                <Input placeholder="e.g. Senior, Mid-Level" value={formData.experience_level} onChange={e => setFormData({ ...formData, experience_level: e.target.value })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Required Skills (Comma separated)</label>
              <Input placeholder="React, Node.js, TypeScript" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="bg-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea 
                required minLength={50}
                className="w-full min-h-[150px] p-3 rounded-md bg-secondary/50 border border-border/60 focus:border-[#00e5ff] focus:outline-none text-sm resize-y"
                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="jd-form" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90">
              {editingJob ? "Save Changes" : "Post Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
