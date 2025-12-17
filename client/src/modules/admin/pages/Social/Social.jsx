import React, { useState, useEffect } from "react";
import { 
  Plus, Instagram, MessageCircle, Send, Edit, Trash2, 
  ExternalLink, Users, Link as LinkIcon, Globe 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';

// --- CONFIGURATION ---
const platformConfig = {
  whatsapp: {
    label: "WhatsApp",
    placeholder: "Enter WhatsApp number (e.g., 1234567890)",
    icon: <MessageCircle className="text-green-600 w-5 h-5" />,
    link: (value) => `https://wa.me/${value.replace(/[^0-9]/g, '')}`,
    validation: /^\d+$/,
    color: "text-green-700 hover:text-green-800"
  },
  instagram: {
    label: "Instagram",
    placeholder: "Enter Instagram username",
    icon: <Instagram className="text-pink-600 w-5 h-5" />,
    link: (value) => {
       const cleanValue = value.replace('@', '').replace(/^https?:\/\//, '').replace(/instagram\.com\/.+\/$/, '');
       return `https://instagram.com/${cleanValue}`;
    },
    validation: null,
    color: "text-pink-600 hover:text-pink-700"
  },
  telegram: {
    label: "Telegram",
    placeholder: "Enter Telegram username",
    icon: <Send className="text-sky-600 w-5 h-5" />,
    link: (value) => {
       const cleanValue = value.replace('@', '').replace(/^https?:\/\//, '').replace(/t\.me\/.+\/$/, '');
       return `https://t.me/${cleanValue}`;
    },
    validation: null,
    color: "text-sky-600 hover:text-sky-700"
  }
};

const Social = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Standard Socials State
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
  const [socials, setSocials] = useState({}); 
  const [formValue, setFormValue] = useState("");

  // Communities State
  const [communities, setCommunities] = useState([]);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communityForm, setCommunityForm] = useState({ name: "", link: "" });

  // --- FETCH DATA ---
  const fetchSocialMedia = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/socialmedia');
      const data = response.data.data || [];

      const organizedSocials = {};
      let fetchedCommunities = [];

      // Process data
      data.forEach(social => {
        if (social.whatsapp) organizedSocials.whatsapp = { id: social._id, value: social.whatsapp, platform: 'whatsapp' };
        if (social.instagram) organizedSocials.instagram = { id: social._id, value: social.instagram, platform: 'instagram' };
        if (social.telegram) organizedSocials.telegram = { id: social._id, value: social.telegram, platform: 'telegram' };
        
        // Collect communities
        if (social.communities && Array.isArray(social.communities)) {
          fetchedCommunities = [...fetchedCommunities, ...social.communities];
        }
      });

      setSocials(organizedSocials);
      setCommunities(fetchedCommunities);
    } catch (error) {
      console.error('Error fetching social media:', error);
      showToast('error', 'Failed to fetch social media data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  // --- STANDARD SOCIAL HANDLERS ---
  const handleChange = (e) => {
    const value = e.target.value;
    const config = platformConfig[selectedPlatform];
    if (config.validation && value !== "" && !config.validation.test(value)) return;
    setFormValue(value);
  };

  const resetForm = () => {
    setFormValue("");
    setSelectedPlatform('whatsapp');
    setIsEditMode(false);
    setCurrentId(null);
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!formValue.trim()) {
      showToast('error', 'Please enter a valid value');
      return;
    }
    setSaving(true);
    try {
      const payload = { [selectedPlatform]: formValue.trim() };
      if (isEditMode && currentId) {
        await axiosInstance.put(`/socialmedia/${currentId}`, payload);
        showToast('success', `${platformConfig[selectedPlatform].label} updated successfully`);
      } else {
        await axiosInstance.post('/socialmedia', payload);
        showToast('success', `${platformConfig[selectedPlatform].label} added successfully`);
      }
      setOpen(false);
      await fetchSocialMedia();
      resetForm();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save';
      showToast('error', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (socialData) => {
    setFormValue(socialData.value || "");
    setSelectedPlatform(socialData.platform);
    setIsEditMode(true);
    setCurrentId(socialData.id);
    setOpen(true);
  };

  const handleDelete = async (socialData) => {
    if (!window.confirm(`Delete ${platformConfig[socialData.platform].label}?`)) return;
    try {
      await axiosInstance.delete(`/socialmedia/${socialData.id}`);
      showToast('success', 'Deleted successfully');
      await fetchSocialMedia();
    } catch (error) {
      showToast('error', 'Failed to delete');
    }
  };

  const handleCreate = (platform = 'whatsapp') => {
    if (socials[platform]) {
      showToast('warning', 'Already exists. Edit it instead.');
      handleEdit(socials[platform]);
      return;
    }
    resetForm();
    setSelectedPlatform(platform);
    setOpen(true);
  };

  // --- COMMUNITY HANDLERS ---
  const handleCommunitySubmit = async () => {
    if (!communityForm.name.trim() || !communityForm.link.trim()) {
        showToast('error', 'Both Name and Link are required');
        return;
    }

    setSaving(true);
    try {
        await axiosInstance.post('/socialmedia/community', communityForm);
        showToast('success', 'Community added successfully');
        setCommunityOpen(false);
        setCommunityForm({ name: "", link: "" });
        await fetchSocialMedia();
    } catch (error) {
        console.error(error);
        showToast('error', error.response?.data?.message || 'Failed to add community');
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteCommunity = async (id) => {
    if (!window.confirm("Are you sure you want to remove this community?")) return;
    try {
        await axiosInstance.delete(`/socialmedia/community/${id}`);
        showToast('success', 'Community removed');
        await fetchSocialMedia();
    } catch (error) {
        console.error(error);
        showToast('error', 'Failed to remove community');
    }
  };


  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      
      {/* --- SECTION 1: STANDARD SOCIALS --- */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
          <div className="flex gap-2">
            {Object.entries(platformConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={socials[key] ? "outline" : "default"}
                size="sm"
                onClick={() => handleCreate(key)}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(platformConfig).map(([platformKey, config]) => {
            const socialData = socials[platformKey];
            const hasLink = socialData && socialData.value && socialData.value.trim();

            return (
              <Card key={platformKey} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100`}>{config.icon}</div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{config.label}</CardTitle>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {hasLink ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(socialData)} className="h-8 w-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(socialData)} className="h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleCreate(platformKey)} className="h-8 px-2">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hasLink ? (
                    <a href={config.link(socialData.value)} target="_blank" rel="noopener noreferrer" 
                       className={`flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 ${config.color} font-medium hover:bg-blue-100 transition-colors`}>
                      <ExternalLink className="w-4 h-4" />
                      <span className="truncate">{socialData.value}</span>
                    </a>
                  ) : (
                    <div className="flex items-center justify-center h-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-400 text-sm">Not configured</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* --- SECTION 2: COMMUNITIES --- */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" /> Communities
          </h2>
          <Button onClick={() => setCommunityOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Community
          </Button>
        </div>

        {communities.length === 0 ? (
           <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
             <Globe className="w-10 h-10 text-gray-400 mx-auto mb-2" />
             <p className="text-gray-500">No additional communities added yet.</p>
           </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((comm) => (
              <Card key={comm._id} className="group hover:shadow-md transition-all relative">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold truncate text-gray-900">{comm.name}</h4>
                      <a href={comm.link} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline truncate block flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Visit Link
                      </a>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteCommunity(comm._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- DIALOG 1: STANDARD SOCIALS --- */}
      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Add'} {platformConfig[selectedPlatform]?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">{platformConfig[selectedPlatform]?.label} Link</Label>
              <div className="relative">
                <Input
                  id="value"
                  value={formValue}
                  onChange={handleChange}
                  placeholder={platformConfig[selectedPlatform]?.placeholder}
                  className="pr-10"
                />
                <div className="absolute right-3 top-2.5">{platformConfig[selectedPlatform]?.icon}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formValue.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 2: COMMUNITIES --- */}
      <Dialog open={communityOpen} onOpenChange={setCommunityOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Community Name</Label>
              <Input 
                placeholder="e.g., Discord Server, Facebook Group"
                value={communityForm.name}
                onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <div className="relative">
                <Input 
                  placeholder="https://..."
                  value={communityForm.link}
                  onChange={(e) => setCommunityForm({...communityForm, link: e.target.value})}
                  className="pl-9"
                />
                <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommunityOpen(false)}>Cancel</Button>
            <Button 
                onClick={handleCommunitySubmit} 
                disabled={saving || !communityForm.name || !communityForm.link}
            >
              {saving ? 'Adding...' : 'Add Community'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Social;