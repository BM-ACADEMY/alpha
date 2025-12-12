  import React, { useState, useEffect } from "react";
  import { Plus, Instagram, MessageCircle, Send, Edit, Trash2, ExternalLink } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
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

  // Icon map for each platform
  const iconMap = {
    whatsapp: <MessageCircle className="text-green-600 w-5 h-5" />,
    instagram: <Instagram className="text-pink-600 w-5 h-5" />,
    telegram: <Send className="text-sky-600 w-5 h-5" />,
  };

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
      placeholder: "Enter Instagram username (e.g., username)",
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
      placeholder: "Enter Telegram username (e.g., username)",
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
    const [open, setOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
    const [socials, setSocials] = useState({}); // { whatsapp: {id, value}, instagram: {id, value}, telegram: {id, value} }
    const [loading, setLoading] = useState(true);
    const [formValue, setFormValue] = useState("");
    const [saving, setSaving] = useState(false);

    // Fetch all social media entries and organize by platform
    const fetchSocialMedia = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/socialmedia');
        const data = response.data.data || [];

        // Create platform-specific objects with only relevant data
        const organizedSocials = {};
        data.forEach(social => {
          if (social.whatsapp) {
            organizedSocials.whatsapp = {
              id: social._id,
              value: social.whatsapp,
              platform: 'whatsapp'
            };
          }
          if (social.instagram) {
            organizedSocials.instagram = {
              id: social._id,
              value: social.instagram,
              platform: 'instagram'
            };
          }
          if (social.telegram) {
            organizedSocials.telegram = {
              id: social._id,
              value: social.telegram,
              platform: 'telegram'
            };
          }
        });

        setSocials(organizedSocials);
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

    // Handle input change with validation
    const handleChange = (e) => {
      const value = e.target.value;
      const config = platformConfig[selectedPlatform];

      // WhatsApp validation - only numbers
      if (config.validation && value !== "" && !config.validation.test(value)) {
        return;
      }

      setFormValue(value);
    };

    // Reset form
    const resetForm = () => {
      setFormValue("");
      setSelectedPlatform('whatsapp');
      setIsEditMode(false);
      setCurrentId(null);
      setSaving(false);
    };

    // Create or Update social media
    const handleSubmit = async () => {
      if (!formValue.trim()) {
        showToast('error', 'Please enter a valid value');
        return;
      }

      setSaving(true);
      try {
        const payload = { [selectedPlatform]: formValue.trim() };

        let response;
        if (isEditMode && currentId) {
          // Update existing record
          response = await axiosInstance.put(`/socialmedia/${currentId}`, payload);
          showToast('success', `${platformConfig[selectedPlatform].label} updated successfully`);
        } else {
          // Create new record using POST (backend handles uniqueness)
          response = await axiosInstance.post('/socialmedia', payload);
          showToast('success', `${platformConfig[selectedPlatform].label} added successfully`);
        }

        setOpen(false);
        await fetchSocialMedia(); // Refresh data
        resetForm();
      } catch (error) {
        console.error('Error saving social media:', error);
        const errorMsg = error.response?.data?.message || 'Failed to save social media';
        showToast('error', errorMsg);
      } finally {
        setSaving(false);
      }
    };

    // Edit social media for specific platform
    const handleEdit = (socialData) => {
      setFormValue(socialData.value || "");
      setSelectedPlatform(socialData.platform);
      setIsEditMode(true);
      setCurrentId(socialData.id);
      setOpen(true);
    };

    // Delete social media for specific platform
    const handleDelete = async (socialData) => {
      if (!window.confirm(`Are you sure you want to delete this ${platformConfig[socialData.platform].label} link?`)) {
        return;
      }

      try {
        await axiosInstance.delete(`/socialmedia/${socialData.id}`);
        showToast('success', `${platformConfig[socialData.platform].label} deleted successfully`);
        await fetchSocialMedia(); // Refresh data
      } catch (error) {
        console.error('Error deleting social media:', error);
        const errorMsg = error.response?.data?.message || 'Failed to delete social media';
        showToast('error', errorMsg);
      }
    };

    // Open create dialog for specific platform
    const handleCreate = (platform = 'whatsapp') => {
      // Check if platform already exists
      if (socials[platform]) {
        showToast('warning', `${platformConfig[platform].label} already exists. Please edit it instead.`);
        handleEdit(socials[platform]);
        return;
      }

      resetForm();
      setSelectedPlatform(platform);
      setOpen(true);
    };

    if (loading) {
      return (
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-500">Loading social media...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
          <div className="flex gap-2">
            {Object.entries(platformConfig)?.map(([key]) => (
              <Button
                key={key}
                variant={socials[key] ? "outline" : "default"}
                size="sm"
                onClick={() => handleCreate(key)}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {platformConfig[key].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(platformConfig)?.map(([platformKey, config]) => {
            const socialData = socials[platformKey];
            const hasLink = socialData && socialData.value && socialData.value.trim();

            return (
              <Card key={platformKey} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        {config.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold capitalize">{config.label}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {hasLink ? 'Link configured' : 'No link added'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {hasLink ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(socialData)}
                            title="Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(socialData)}
                            title="Delete"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreate(platformKey)}
                          title={`Add ${config.label}`}
                          className="h-8 px-2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {hasLink ? (
                    <div className="space-y-2">
                      <a
                        href={config.link(socialData.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 ${config.color} font-medium hover:bg-blue-100 transition-colors break-words`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="truncate">{socialData.value}</span>
                        <span className="text-xs text-gray-500">(Click to open)</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg">
                      <p className="text-gray-400 text-sm italic">
                        Click "Add" to configure {config.label.toLowerCase()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dialog for Add/Edit */}
        <Dialog open={open} onOpenChange={(open) => {
          setOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode
                  ? `Edit ${platformConfig[selectedPlatform].label}`
                  : `Add ${platformConfig[selectedPlatform].label}`
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="value">{platformConfig[selectedPlatform].label} Link</Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="text"
                    inputMode={selectedPlatform === 'whatsapp' ? "tel" : "text"}
                    placeholder={platformConfig[selectedPlatform].placeholder}
                    value={formValue}
                    onChange={handleChange}
                    disabled={saving}
                    className="pr-10"
                  />
                  {platformConfig[selectedPlatform].icon}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedPlatform === 'whatsapp'
                    ? 'Enter phone number without country code or + sign'
                    : 'Enter username without @ symbol'
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formValue.trim() || saving}
                className="min-w-[80px]"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : isEditMode ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  export default Social;
